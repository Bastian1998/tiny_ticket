import { Event } from '../domain/events/Event';
import { User } from '../domain/users/User';
import { EventRepository } from '../infrastructure/repositories/EventRepository';

/** MOCK (simplified) - admin moderation: list every event and take one down. */
export class ModerationService {
  constructor(private readonly events: EventRepository) {}

  async listAll(admin: User): Promise<Event[]> {
    admin.assertCan('MODERATE_EVENT');
    return this.events.find();
  }

  async removeEvent(admin: User, eventId: string, reason: string): Promise<Event> {
    admin.assertCan('MODERATE_EVENT');
    return this.events.modify(eventId, (e) => e.remove(reason));
  }
}
