import { Event } from '../domain/events/Event';
import { Ticket } from '../domain/tickets/Ticket';
import { User } from '../domain/users/User';
import { EventRepository } from '../infrastructure/repositories/EventRepository';
import { TicketRepository } from '../infrastructure/repositories/TicketRepository';

export interface TicketWithEvent {
  ticket: Ticket;
  event: Event | null;
}

/** "My tickets" for the logged-in attendee. */
export class TicketQueryService {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly events: EventRepository,
  ) {}

  async listForAttendee(attendee: User): Promise<TicketWithEvent[]> {
    attendee.assertCan('VIEW_OWN_TICKETS');
    const tickets = await this.tickets.findByAttendee(attendee.id);
    const eventIds = [...new Set(tickets.map((t) => t.eventId))];
    const events = new Map<string, Event>();
    for (const id of eventIds) {
      const e = await this.events.findById(id);
      if (e) events.set(id, e);
    }
    return tickets.map((ticket) => ({ ticket, event: events.get(ticket.eventId) ?? null }));
  }
}
