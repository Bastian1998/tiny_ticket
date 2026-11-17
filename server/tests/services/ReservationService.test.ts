import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createContainer } from '../../src/container';
import { ConcurrencyError, PaymentRejectedError, SoldOutError, ValidationError } from '../../src/domain/errors';
import { Event } from '../../src/domain/events/Event';
import { PaymentMethod, PaymentStrategy } from '../../src/domain/payments/PaymentStrategy';
import { PaymentStrategyFactory } from '../../src/domain/payments/PaymentStrategyFactory';
import { Attendee } from '../../src/domain/users/Attendee';
import { MockEmailNotificationService } from '../../src/services/NotificationService';
import { clearTestDb, startTestDb, stopTestDb } from '../helpers/testDb';

const attendees = Array.from({ length: 20 }, (_, i) => new Attendee({ id: `a${i}`, name: `A${i}`, email: `a${i}@x` }));

async function createEvent(c: ReturnType<typeof createContainer>, capacity: number, price = 0): Promise<Event> {
  const event = Event.create('org', {
    title: 'Show',
    description: '',
    location: 'Bar',
    startsAt: new Date(Date.now() + 86_400_000),
    capacity,
    price,
  });
  await c.events.insert(event);
  return event;
}

describe('ReservationService', () => {
  beforeAll(startTestDb);
  afterAll(stopTestDb);
  beforeEach(clearTestDb);

  it('reserves free tickets and sends the (mock) confirmation', async () => {
    const notifier = new MockEmailNotificationService();
    const c = createContainer({ notifier });
    const event = await createEvent(c, 10);

    const result = await c.reservationService.reserve(attendees[0], { eventId: event.id, quantity: 3 });

    expect(result.tickets).toHaveLength(3);
    expect(result.total).toBe(0);
    expect((await c.events.getById(event.id)).availableSeats).toBe(7);
    expect(notifier.outbox).toHaveLength(1);
  });

  it('charges paid events price x quantity', async () => {
    const c = createContainer();
    const event = await createEvent(c, 10, 2500);
    const result = await c.reservationService.reserve(attendees[0], {
      eventId: event.id,
      quantity: 2,
      paymentMethod: 'CARD',
    });
    expect(result.total).toBe(5000);
    expect(result.tickets.every((t) => t.kind === 'PAID' && t.getPrice() === 2500)).toBe(true);
  });

  it('rejects invalid quantities and sold-out requests', async () => {
    const c = createContainer();
    const event = await createEvent(c, 2);
    await expect(c.reservationService.reserve(attendees[0], { eventId: event.id, quantity: 0 })).rejects.toThrow(ValidationError);
    await expect(c.reservationService.reserve(attendees[0], { eventId: event.id, quantity: 3 })).rejects.toThrow(SoldOutError);
  });

  it('NEVER oversells: 20 simultaneous requests for 5 seats -> exactly 5 tickets', async () => {
    const c = createContainer();
    const event = await createEvent(c, 5);

    const results = await Promise.allSettled(
      attendees.map((a) => c.reservationService.reserve(a, { eventId: event.id, quantity: 1 })),
    );

    const ok = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    expect(ok).toHaveLength(5);
    expect(failed).toHaveLength(15);
    for (const f of failed) {
      expect(f.reason instanceof SoldOutError || f.reason instanceof ConcurrencyError).toBe(true);
    }

    const saved = await c.events.getById(event.id);
    expect(saved.availableSeats).toBe(0);
    expect(await c.tickets.countByEvent(event.id)).toBe(5);
  });

  it('gives the seats back when the payment is rejected (compensation)', async () => {
    const rejecting: PaymentStrategy = {
      method: 'CARD' as PaymentMethod,
      pay: async () => ({ approved: false, method: 'CARD', transactionId: '', reason: 'Fondos insuficientes' }),
    };
    const c = createContainer({ paymentFactory: new PaymentStrategyFactory([rejecting]) });
    const event = await createEvent(c, 4, 1000);

    await expect(
      c.reservationService.reserve(attendees[0], { eventId: event.id, quantity: 2, paymentMethod: 'CARD' }),
    ).rejects.toThrow(PaymentRejectedError);

    expect((await c.events.getById(event.id)).availableSeats).toBe(4);
    expect(await c.tickets.countByEvent(event.id)).toBe(0);
  });
});
