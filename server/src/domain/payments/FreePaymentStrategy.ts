import { randomUUID } from 'crypto';
import { PaymentMethod, PaymentRequest, PaymentResult, PaymentStrategy } from './PaymentStrategy';

/** Concrete strategy for free events: nothing to charge, it only checks the amount is 0. */
export class FreePaymentStrategy implements PaymentStrategy {
  readonly method: PaymentMethod = 'FREE';

  async pay(request: PaymentRequest): Promise<PaymentResult> {
    if (request.amount !== 0) {
      return {
        approved: false,
        method: this.method,
        transactionId: '',
        reason: 'Un evento pago no puede usar el medio gratuito',
      };
    }
    return { approved: true, method: this.method, transactionId: `FREE-${randomUUID().slice(0, 8)}` };
  }
}
