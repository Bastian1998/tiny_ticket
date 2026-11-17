import { ForbiddenError, InvalidStateError, NotFoundError } from '../domain/errors';
import { Event } from '../domain/events/Event';
import { Ticket } from '../domain/tickets/Ticket';
import { User } from '../domain/users/User';
import { EventRepository } from '../infrastructure/repositories/EventRepository';
import { TicketRepository } from '../infrastructure/repositories/TicketRepository';
import { UserRepository } from '../infrastructure/repositories/UserRepository';

export interface ValidationOutcome {
  ticket: Ticket;
  event: Event;
  attendeeName: string;
}

/**
 * MOCK (simplified) - door check. The organizer types/scans the code shown in
 * the QR and the ticket is marked as used. A ticket can only be used once.
 */
export class TicketValidationService {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly events: EventRepository,
    private readonly users: UserRepository,
  ) {}

  async validate(organizer: User, code: string): Promise<ValidationOutcome> {
    organizer.assertCan('VALIDATE_TICKET');
    const ticket = await this.tickets.findByCode(code);
    if (!ticket) throw new NotFoundError('Codigo de entrada inexistente');

    const event = await this.events.getById(ticket.eventId);
    if (!event.isOwnedBy(organizer.id)) {
      throw new ForbiddenError('La entrada pertenece a un evento de otro organizador');
    }
    if (event.status !== 'PUBLISHED') {
      throw new InvalidStateError(`El evento esta ${event.status === 'CANCELLED' ? 'cancelado' : 'dado de baja'}`);
    }

    ticket.markUsed(); // throws if already used
    const saved = await this.tickets.saveUsedIfStillValid(ticket);
    if (!saved) throw new InvalidStateError('La entrada ya fue utilizada');

    const attendee = await this.users.findById(ticket.attendeeId);
    return { ticket, event, attendeeName: attendee?.name ?? '-' };
  }
}
