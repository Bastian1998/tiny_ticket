import { describe, expect, it } from 'vitest';
import { InvalidStateError, ValidationError } from '../../src/domain/errors';
import { Event } from '../../src/domain/events/Event';
import { CardPaymentStrategy } from '../../src/domain/payments/CardPaymentStrategy';
import { FreePaymentStrategy } from '../../src/domain/payments/FreePaymentStrategy';
import { MercadoPagoPaymentStrategy } from '../../src/domain/payments/MercadoPagoPaymentStrategy';
import { PaymentProcessor } from '../../src/domain/payments/PaymentProcessor';
import { PaymentStrategyFactory } from '../../src/domain/payments/PaymentStrategyFactory';
import { FreeTicket } from '../../src/domain/tickets/FreeTicket';
import { PaidTicket } from '../../src/domain/tickets/PaidTicket';
import { TicketFactory } from '../../src/domain/tickets/TicketFactory';
import { Admin } from '../../src/domain/users/Admin';
import { Attendee } from '../../src/domain/users/Attendee';
import { Organizer } from '../../src/domain/users/Organizer';

const event = (price: number) =>
  Event.create('org', {
    title: 'E',
    description: '',
    location: 'L',
    startsAt: new Date(Date.now() + 86_400_000),
    capacity: 5,
    price,
  });

const req = (amount: number) => ({ amount, currency: 'ARS' as const, payerId: 'u', description: 'd' });

describe('Strategy pattern - payments', () => {
  const factory = new PaymentStrategyFactory();

  it('uses the free strategy for free events, whatever the user asked for', () => {
    expect(factory.forEvent(event(0), 'CARD')).toBeInstanceOf(FreePaymentStrategy);
  });

  it('uses the chosen strategy for paid events', () => {
    expect(factory.forEvent(event(500), 'CARD')).toBeInstanceOf(CardPaymentStrategy);
    expect(factory.forEvent(event(500), 'MERCADO_PAGO')).toBeInstanceOf(MercadoPagoPaymentStrategy);
    expect(() => factory.forEvent(event(500), 'FREE')).toThrow(ValidationError);
  });

  it('the context delegates to whichever strategy it holds', async () => {
    const processor = new PaymentProcessor(new FreePaymentStrategy());
    expect((await processor.process(req(0))).approved).toBe(true);
    expect((await processor.process(req(100))).approved).toBe(false);

    processor.setStrategy(new MercadoPagoPaymentStrategy());
    const result = await processor.process(req(100));
    expect(result.approved).toBe(true);
    expect(result.transactionId).toMatch(/^MP-/);
  });
});

describe('Ticket hierarchy', () => {
  it('builds the right subclass and price (polymorphism)', () => {
    const free = TicketFactory.issue(event(0), 'u', { approved: true, method: 'FREE', transactionId: 'x' });
    const paid = TicketFactory.issue(event(750), 'u', { approved: true, method: 'CARD', transactionId: 'CARD-1' });
    expect(free).toBeInstanceOf(FreeTicket);
    expect(free.getPrice()).toBe(0);
    expect(paid).toBeInstanceOf(PaidTicket);
    expect(paid.getPrice()).toBe(750);
    expect(paid.code).toMatch(/^TT-[0-9A-F]{12}$/);
  });

  it('can only be used once', () => {
    const t = TicketFactory.issue(event(0), 'u', { approved: true, method: 'FREE', transactionId: 'x' });
    t.markUsed();
    expect(t.status).toBe('USED');
    expect(() => t.markUsed()).toThrow(InvalidStateError);
  });
});

describe('User hierarchy', () => {
  it('each role answers can() differently (polymorphism)', () => {
    const org = new Organizer({ id: '1', name: 'O', email: 'o@x' });
    const att = new Attendee({ id: '2', name: 'A', email: 'a@x' });
    const adm = new Admin({ id: '3', name: 'D', email: 'd@x' });
    expect(org.can('CREATE_EVENT')).toBe(true);
    expect(att.can('CREATE_EVENT')).toBe(false);
    expect(att.can('RESERVE_TICKET')).toBe(true);
    expect(adm.can('MODERATE_EVENT')).toBe(true);
    expect(org.can('MODERATE_EVENT')).toBe(false);
  });
});
