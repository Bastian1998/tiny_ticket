import { randomUUID } from 'crypto';
import { PaymentMethod, PaymentRequest, PaymentResult, PaymentStrategy } from './PaymentStrategy';

/**
 * Concrete strategy: credit/debit card.
 * MOCK - in the MVP it always approves. No card data is collected.
 */
export class CardPaymentStrategy implements PaymentStrategy {
  readonly method: PaymentMethod = 'CARD';

  async pay(request: PaymentRequest): Promise<PaymentResult> {
    console.info(`[mock Tarjeta] Cobro aprobado: $${request.amount} ${request.currency} - ${request.description}`);
    return { approved: true, method: this.method, transactionId: `CARD-${randomUUID().slice(0, 8)}` };
  }
}
