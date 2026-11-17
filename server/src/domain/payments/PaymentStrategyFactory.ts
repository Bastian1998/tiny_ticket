import { ValidationError } from '../errors';
import { Event } from '../events/Event';
import { CardPaymentStrategy } from './CardPaymentStrategy';
import { FreePaymentStrategy } from './FreePaymentStrategy';
import { MercadoPagoPaymentStrategy } from './MercadoPagoPaymentStrategy';
import { PAYMENT_METHODS, PaymentMethod, PaymentStrategy } from './PaymentStrategy';

/** Picks the right PaymentStrategy for an event and the method the attendee chose. */
export class PaymentStrategyFactory {
  private readonly strategies: Map<PaymentMethod, PaymentStrategy>;

  constructor(strategies: PaymentStrategy[] = PaymentStrategyFactory.defaults()) {
    this.strategies = new Map(strategies.map((s) => [s.method, s]));
  }

  static defaults(): PaymentStrategy[] {
    return [new FreePaymentStrategy(), new MercadoPagoPaymentStrategy(), new CardPaymentStrategy()];
  }

  static isPaymentMethod(value: unknown): value is PaymentMethod {
    return typeof value === 'string' && (PAYMENT_METHODS as readonly string[]).includes(value);
  }

  /**
   * Free events always use FreePaymentStrategy.
   * Paid events need MERCADO_PAGO or CARD.
   */
  forEvent(event: Event, requested?: PaymentMethod): PaymentStrategy {
    const method: PaymentMethod = event.isFree() ? 'FREE' : (requested ?? 'MERCADO_PAGO');
    if (!event.isFree() && method === 'FREE') {
      throw new ValidationError('El evento es pago: elegi Mercado Pago o tarjeta');
    }
    const strategy = this.strategies.get(method);
    if (!strategy) {
      throw new ValidationError(`Medio de pago no soportado: ${method}`);
    }
    return strategy;
  }
}
