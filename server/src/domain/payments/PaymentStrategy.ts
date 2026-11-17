export type PaymentMethod = 'FREE' | 'MERCADO_PAGO' | 'CARD';

export const PAYMENT_METHODS: readonly PaymentMethod[] = ['FREE', 'MERCADO_PAGO', 'CARD'];

export interface PaymentRequest {
  /** Total to charge (price x quantity). */
  amount: number;
  currency: 'ARS';
  payerId: string;
  description: string;
}

export interface PaymentResult {
  approved: boolean;
  method: PaymentMethod;
  transactionId: string;
  /** Why it was rejected, if it was. */
  reason?: string;
}

/**
 * STRATEGY PATTERN - the Strategy interface.
 *
 * Every payment method is an interchangeable strategy. The reservation
 * algorithm only talks to this interface, so adding a new method
 * (e.g. bank transfer) means adding a new class, without touching the algorithm.
 */
export interface PaymentStrategy {
  readonly method: PaymentMethod;
  pay(request: PaymentRequest): Promise<PaymentResult>;
}
