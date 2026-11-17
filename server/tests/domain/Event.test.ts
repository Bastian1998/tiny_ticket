import { describe, expect, it } from 'vitest';
import { InvalidStateError, SoldOutError, ValidationError } from '../../src/domain/errors';
import { Event, EventDetailsInput } from '../../src/domain/events/Event';

const future = () => new Date(Date.now() + 7 * 24 * 3600 * 1000);
const input = (over: Partial<EventDetailsInput> = {}): EventDetailsInput => ({
  title: 'Jazz',
  description: '',
  location: 'Bar',
  startsAt: future(),
  capacity: 10,
  price: 0,
  ...over,
});

describe('Event', () => {
  it('starts with every seat available and published', () => {
    const e = Event.create('org', input());
    expect(e.availableSeats).toBe(10);
    expect(e.soldSeats).toBe(0);
    expect(e.status).toBe('PUBLISHED');
    expect(e.isFree()).toBe(true);
  });

  it('rejects invalid data', () => {
    expect(() => Event.create('org', input({ title: ' ' }))).toThrow(ValidationError);
    expect(() => Event.create('org', input({ capacity: 0 }))).toThrow(ValidationError);
    expect(() => Event.create('org', input({ capacity: 2.5 }))).toThrow(ValidationError);
    expect(() => Event.create('org', input({ price: -1 }))).toThrow(ValidationError);
    expect(() => Event.create('org', input({ startsAt: new Date(Date.now() - 1000) }))).toThrow(ValidationError);
  });

  it('reserves seats and never goes below zero', () => {
    const e = Event.create('org', input({ capacity: 3 }));
    e.reserveSeats(2);
    expect(e.availableSeats).toBe(1);
    expect(() => e.reserveSeats(2)).toThrow(SoldOutError);
    e.reserveSeats(1);
    expect(e.isSoldOut()).toBe(true);
    expect(() => e.reserveSeats(1)).toThrow(SoldOutError);
  });

  it('releases seats but never more than were sold', () => {
    const e = Event.create('org', input({ capacity: 3 }));
    e.reserveSeats(2);
    e.releaseSeats(2);
    expect(e.availableSeats).toBe(3);
    expect(() => e.releaseSeats(1)).toThrow(InvalidStateError);
  });

  it('cannot shrink capacity below the seats already sold', () => {
    const e = Event.create('org', input({ capacity: 10 }));
    e.reserveSeats(6);
    expect(() => e.changeCapacity(5)).toThrow(ValidationError);
    e.changeCapacity(8);
    expect(e.capacity).toBe(8);
    expect(e.availableSeats).toBe(2);
  });

  it('cannot change the price once tickets were issued', () => {
    const e = Event.create('org', input({ price: 1000 }));
    e.reserveSeats(1);
    expect(() => e.updateDetails(input({ price: 2000 }))).toThrow(ValidationError);
  });

  it('does not accept reservations when cancelled or removed', () => {
    const cancelled = Event.create('org', input());
    cancelled.cancel();
    expect(cancelled.isBookable()).toBe(false);
    expect(() => cancelled.reserveSeats(1)).toThrow(InvalidStateError);

    const removed = Event.create('org', input());
    removed.remove('spam');
    expect(removed.status).toBe('REMOVED');
    expect(removed.removalReason).toBe('spam');
    expect(() => removed.reserveSeats(1)).toThrow(InvalidStateError);
  });
});
