import { NotFoundError, PaymentRejectedError, ValidationError } from '../domain/errors';
import { PaymentProcessor } from '../domain/payments/PaymentProcessor';
import { PaymentMethod } from '../domain/payments/PaymentStrategy';
import { PaymentStrategyFactory } from '../domain/payments/PaymentStrategyFactory';
import { Ticket } from '../domain/tickets/Ticket';
import { TicketFactory } from '../domain/tickets/TicketFactory';
import { User } from '../domain/users/User';
import { EventRepository } from '../infrastructure/repositories/EventRepository';
import { TicketRepository } from '../infrastructure/repositories/TicketRepository';
import { NotificationService } from './NotificationService';

export const MAX_TICKETS_PER_ORDER = 10;

export interface ReservationRequest {
  eventId: string;
  quantity: number;
  /** Ignored for free events. */
  paymentMethod?: PaymentMethod;
}

export interface ReservationResult {
  tickets: Ticket[];
  total: number;
  transactionId: string;
}

/**
 * Core algorithm of the system: reserve/buy tickets WITHOUT OVERSELLING.
 * See docs/reservation-algorithm.md for the pseudocode.
 */
export class ReservationService {
  constructor(
    private readonly events: EventRepository,
    private readonly tickets: TicketRepository,
    private readonly paymentFactory: PaymentStrategyFactory,
    private readonly notifier: NotificationService,
  ) {}

  async reserve(attendee: User, request: ReservationRequest): Promise<ReservationResult> {
    // 1. Validate the request
    attendee.assertCan('RESERVE_TICKET');
    const { eventId, quantity } = request;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TICKETS_PER_ORDER) {
      throw new ValidationError(`La cantidad debe ser entre 1 y ${MAX_TICKETS_PER_ORDER}`);
    }
    const current = await this.events.findById(eventId);
    if (!current) throw new NotFoundError('El evento no existe');
    // Choose the strategy before touching the seats, so a bad method fails fast.
    const processor = new PaymentProcessor(this.paymentFactory.forEvent(current, request.paymentMethod));

    // 2-3. Take the seats inside the Event (domain rule) and save with optimistic
    //      locking + retries. Throws SoldOutError if there are not enough seats.
    const event = await this.events.modify(eventId, (e) => e.reserveSeats(quantity));

    // 4. Charge through the selected strategy (free / Mercado Pago / card).
    const total = event.price * quantity;
    const payment = await processor.process({
      amount: total,
      currency: 'ARS',
      payerId: attendee.id,
      description: `${quantity} entrada(s) - ${event.title}`,
    });

    // 5. Payment rejected -> compensate: give the seats back.
    if (!payment.approved) {
      await this.events.modify(eventId, (e) => e.releaseSeats(quantity));
      throw new PaymentRejectedError(payment.reason ?? 'El pago fue rechazado');
    }

    // 6. Issue one ticket per seat (FreeTicket or PaidTicket) with a unique code.
    const issued = Array.from({ length: quantity }, () => TicketFactory.issue(event, attendee.id, payment));
    try {
      await this.tickets.insertMany(issued);
    } catch (err) {
      await this.events.modify(eventId, (e) => e.releaseSeats(quantity));
      throw err;
    }

    // 7. Send the confirmation (mock email).
    await this.notifier.sendTicketConfirmation(attendee, event, issued);

    return { tickets: issued, total, transactionId: payment.transactionId };
  }
}
