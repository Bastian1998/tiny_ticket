/**
 * Domain errors. The domain does not know about HTTP; the API layer
 * (api/middleware/errorHandler.ts) translates each type to a status code.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Input data breaks a business rule (e.g. capacity <= 0). */
export class ValidationError extends DomainError {}

/** The requested entity does not exist. */
export class NotFoundError extends DomainError {}

/** The user is not allowed to perform the action. */
export class ForbiddenError extends DomainError {}

/** The entity is in a state that does not allow the operation (e.g. reserve on a cancelled event). */
export class InvalidStateError extends DomainError {}

/** Not enough seats left to satisfy the reservation. */
export class SoldOutError extends DomainError {}

/** Optimistic locking failed too many times (too much concurrent traffic on the same event). */
export class ConcurrencyError extends DomainError {}

/** The payment strategy rejected the payment. */
export class PaymentRejectedError extends DomainError {}
