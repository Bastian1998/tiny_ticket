import { randomUUID } from 'crypto';
import { PaymentMethod, PaymentRequest, PaymentResult, PaymentStrategy } from './PaymentStrategy';

/**
 * Concrete strategy: Mercado Pago.
 * MOCK - in the MVP it always approves. The real version would call the
 * Mercado Pago API here; nothing else in the system would change.
 */
export class MercadoPagoPaymentStrategy implements PaymentStrategy {
  readonly method: PaymentMethod = 'MERCADO_PAGO';

  async pay(request: PaymentRequest): Promise<PaymentResult> {
    console.info(`[mock MercadoPago] Cobro aprobado: $${request.amount} ${request.currency} - ${request.description}`);
    return { approved: true, method: this.method, transactionId: `MP-${randomUUID().slice(0, 8)}` };
  }
}
