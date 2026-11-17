import { PaymentRequest, PaymentResult, PaymentStrategy } from './PaymentStrategy';

/**
 * STRATEGY PATTERN - the Context.
 * Holds a strategy and delegates the payment to it, without knowing which one it is.
 */
export class PaymentProcessor {
  constructor(private strategy: PaymentStrategy) {}

  setStrategy(strategy: PaymentStrategy): void {
    this.strategy = strategy;
  }

  get method(): string {
    return this.strategy.method;
  }

  process(request: PaymentRequest): Promise<PaymentResult> {
    return this.strategy.pay(request);
  }
}
