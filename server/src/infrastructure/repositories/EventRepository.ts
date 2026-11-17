import { setTimeout as sleep } from 'timers/promises';
import { ConcurrencyError, NotFoundError } from '../../domain/errors';
import { Event, EventSnapshot, EventStatus } from '../../domain/events/Event';
import { EventModel } from '../db/models';

interface EventDoc extends Omit<EventSnapshot, 'id'> {
  _id: string;
}

export interface EventQuery {
  status?: EventStatus;
  organizerId?: string;
  /** Only events that have not started yet. */
  upcoming?: boolean;
  /** Free-text search on title and location. */
  search?: string;
}

export const DEFAULT_MAX_ATTEMPTS = 10;

export class EventRepository {
  async findById(id: string): Promise<Event | null> {
    const doc = await EventModel.findById(id).lean<EventDoc>();
    return doc ? this.toDomain(doc) : null;
  }

  async getById(id: string): Promise<Event> {
    const event = await this.findById(id);
    if (!event) throw new NotFoundError('El evento no existe');
    return event;
  }

  async find(query: EventQuery = {}): Promise<Event[]> {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.organizerId) filter.organizerId = query.organizerId;
    if (query.upcoming) filter.startsAt = { $gt: new Date() };
    if (query.search) {
      const rx = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { location: rx }];
    }
    const docs = await EventModel.find(filter).sort({ startsAt: 1 }).lean<EventDoc[]>();
    return docs.map((d) => this.toDomain(d));
  }

  /** Inserts a brand-new event. */
  async insert(event: Event): Promise<void> {
    const { id, ...rest } = event.toSnapshot();
    await EventModel.create({ _id: id, ...rest });
  }

  /**
   * Optimistic locking: saves the event only if nobody else saved it since we
   * loaded it (same `version`). Returns the saved event (version + 1), or null
   * if there was a conflict.
   */
  async saveIfUnchanged(event: Event): Promise<Event | null> {
    const { id, version, ...rest } = event.toSnapshot();
    const result = await EventModel.updateOne(
      { _id: id, version },
      { $set: { ...rest, version: version + 1 } },
    );
    if (result.matchedCount === 0) return null;
    return Event.restore({ ...event.toSnapshot(), version: version + 1 });
  }

  /**
   * Load -> mutate -> save, retried on conflict.
   * `mutate` runs the domain method (e.g. e => e.reserveSeats(2)); if it throws
   * a business error (SoldOutError...) the error goes straight to the caller.
   * This is how every seat/state change is written, so concurrent requests can
   * never overwrite each other and the event can never be oversold.
   */
  async modify(
    id: string,
    mutate: (event: Event) => void,
    maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  ): Promise<Event> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const event = await this.getById(id);
      mutate(event);
      const saved = await this.saveIfUnchanged(event);
      if (saved) return saved;
      // Someone else won the race: wait a little (random jitter) and retry with fresh data.
      await sleep(5 + Math.floor(Math.random() * 20 * attempt));
    }
    throw new ConcurrencyError('Hay mucha demanda en este evento, intenta nuevamente');
  }

  async deleteAll(): Promise<void> {
    await EventModel.deleteMany({});
  }

  private toDomain(doc: EventDoc): Event {
    const { _id, ...rest } = doc;
    return Event.restore({
      id: _id,
      organizerId: rest.organizerId,
      title: rest.title,
      description: rest.description ?? '',
      location: rest.location,
      startsAt: new Date(rest.startsAt),
      capacity: rest.capacity,
      availableSeats: rest.availableSeats,
      price: rest.price,
      status: rest.status,
      removalReason: rest.removalReason,
      version: rest.version ?? 0,
    });
  }
}
