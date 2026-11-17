import { ForbiddenError, NotFoundError } from '../domain/errors';
import { Event, EventDetailsInput } from '../domain/events/Event';
import { User } from '../domain/users/User';
import { EventRepository } from '../infrastructure/repositories/EventRepository';
import { UserRepository } from '../infrastructure/repositories/UserRepository';

export interface EventView {
  event: Event;
  organizerName: string;
}

/** Use cases for publishing, editing, listing and viewing events. */
export class EventService {
  constructor(
    private readonly events: EventRepository,
    private readonly users: UserRepository,
  ) {}

  /** Public catalogue: published events that have not started yet. */
  async listPublic(search?: string): Promise<EventView[]> {
    const events = await this.events.find({ status: 'PUBLISHED', upcoming: true, search });
    return this.withOrganizerNames(events);
  }

  async getDetail(id: string): Promise<EventView> {
    const event = await this.events.findById(id);
    if (!event || event.status === 'REMOVED') throw new NotFoundError('El evento no existe');
    const [view] = await this.withOrganizerNames([event]);
    return view;
  }

  async listByOrganizer(organizer: User): Promise<Event[]> {
    organizer.assertCan('VIEW_DASHBOARD');
    return this.events.find({ organizerId: organizer.id });
  }

  async create(organizer: User, input: EventDetailsInput): Promise<Event> {
    organizer.assertCan('CREATE_EVENT');
    const event = Event.create(organizer.id, input);
    await this.events.insert(event);
    return event;
  }

  async update(organizer: User, id: string, input: EventDetailsInput): Promise<Event> {
    organizer.assertCan('EDIT_EVENT');
    await this.assertOwner(organizer, id);
    // Same optimistic-locking path as reservations, so an edit can't overwrite seats sold meanwhile.
    return this.events.modify(id, (e) => e.updateDetails(input));
  }

  async cancel(organizer: User, id: string): Promise<Event> {
    organizer.assertCan('EDIT_EVENT');
    await this.assertOwner(organizer, id);
    return this.events.modify(id, (e) => e.cancel());
  }

  private async assertOwner(organizer: User, id: string): Promise<void> {
    const event = await this.events.getById(id);
    if (!event.isOwnedBy(organizer.id)) {
      throw new ForbiddenError('Solo el organizador del evento puede modificarlo');
    }
  }

  private async withOrganizerNames(events: Event[]): Promise<EventView[]> {
    const ids = [...new Set(events.map((e) => e.organizerId))];
    const organizers = new Map((await this.users.findByIds(ids)).map((u) => [u.id, u.name]));
    return events.map((event) => ({ event, organizerName: organizers.get(event.organizerId) ?? '-' }));
  }
}
