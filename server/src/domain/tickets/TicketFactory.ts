import { randomUUID } from 'crypto';
import { Event } from '../events/Event';
import { PaymentResult } from '../payments/PaymentStrategy';
import { FreeTicket } from './FreeTicket';
import { PaidTicket } from './PaidTicket';
import { Ticket, TicketSnapshot } from './Ticket';

/** Decides which Ticket subclass to build. */
export class TicketFactory {
  /** Issues one new ticket for an event that has just been reserved/paid. */
  static issue(event: Event, attendeeId: string, payment: PaymentResult, now: Date = new Date()): Ticket {
    const base = {
      id: randomUUID(),
      code: TicketFactory.generateCode(),
      eventId: event.id,
      attendeeId,
      status: 'VALID' as const,
      issuedAt: now,
    };
    if (event.isFree()) {
      return new FreeTicket(base);
    }
    return new PaidTicket({
      ...base,
      price: event.price,
      paymentId: payment.transactionId,
      paymentMethod: payment.method,
    });
  }

  /** Rebuilds a ticket from the database. */
  static restore(s: TicketSnapshot): Ticket {
    if (s.kind === 'PAID') {
      return new PaidTicket({
        ...s,
        price: s.price,
        paymentId: s.paymentId ?? '',
        paymentMethod: s.paymentMethod ?? '',
      });
    }
    return new FreeTicket(s);
  }

  /** Short, human-readable, hard-to-guess code, e.g. "TT-9F3A1C2B7D4E". */
  static generateCode(): string {
    return `TT-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  }
}
