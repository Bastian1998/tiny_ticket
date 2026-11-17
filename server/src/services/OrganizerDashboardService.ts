import { ForbiddenError } from '../domain/errors';
import { Event } from '../domain/events/Event';
import { Ticket } from '../domain/tickets/Ticket';
import { User } from '../domain/users/User';
import { EventRepository } from '../infrastructure/repositories/EventRepository';
import { TicketRepository } from '../infrastructure/repositories/TicketRepository';
import { UserRepository } from '../infrastructure/repositories/UserRepository';

export interface EventSummary {
  event: Event;
  ticketsIssued: number;
  ticketsUsed: number;
  revenue: number;
  occupancy: number; // 0..1
}

export interface DashboardSummary {
  events: EventSummary[];
  totals: { events: number; ticketsIssued: number; revenue: number };
}

export interface AttendeeRow {
  attendeeId: string;
  name: string;
  email: string;
  tickets: { code: string; status: string; issuedAt: Date }[];
}

/** Organizer panel: sales, seats left and attendees for their own events. */
export class OrganizerDashboardService {
  constructor(
    private readonly events: EventRepository,
    private readonly tickets: TicketRepository,
    private readonly users: UserRepository,
  ) {}

  async getDashboard(organizer: User): Promise<DashboardSummary> {
    organizer.assertCan('VIEW_DASHBOARD');
    const events = await this.events.find({ organizerId: organizer.id });
    const tickets = await this.tickets.findByEvents(events.map((e) => e.id));
    const byEvent = groupBy(tickets, (t) => t.eventId);

    const summaries = events.map((event): EventSummary => {
      const list = byEvent.get(event.id) ?? [];
      return {
        event,
        ticketsIssued: list.length,
        ticketsUsed: list.filter((t) => t.status === 'USED').length,
        // Polymorphism: each ticket knows its own price (FreeTicket -> 0).
        revenue: list.reduce((sum, t) => sum + t.getPrice(), 0),
        occupancy: event.soldSeats / event.capacity,
      };
    });

    return {
      events: summaries,
      totals: {
        events: summaries.length,
        ticketsIssued: summaries.reduce((s, e) => s + e.ticketsIssued, 0),
        revenue: summaries.reduce((s, e) => s + e.revenue, 0),
      },
    };
  }

  async getAttendees(organizer: User, eventId: string): Promise<{ event: Event; attendees: AttendeeRow[] }> {
    organizer.assertCan('VIEW_DASHBOARD');
    const event = await this.events.getById(eventId);
    if (!event.isOwnedBy(organizer.id)) throw new ForbiddenError('El evento no es tuyo');

    const tickets = await this.tickets.findByEvents([eventId]);
    const byAttendee = groupBy(tickets, (t) => t.attendeeId);
    const people = new Map((await this.users.findByIds([...byAttendee.keys()])).map((u) => [u.id, u]));

    const attendees = [...byAttendee.entries()].map(([attendeeId, list]): AttendeeRow => ({
      attendeeId,
      name: people.get(attendeeId)?.name ?? '-',
      email: people.get(attendeeId)?.email ?? '-',
      tickets: list.map((t) => ({ code: t.code, status: t.status, issuedAt: t.issuedAt })),
    }));
    return { event, attendees };
  }
}

function groupBy(tickets: Ticket[], key: (t: Ticket) => string): Map<string, Ticket[]> {
  const map = new Map<string, Ticket[]>();
  for (const t of tickets) {
    const k = key(t);
    map.set(k, [...(map.get(k) ?? []), t]);
  }
  return map;
}
