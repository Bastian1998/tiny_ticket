import { NextFunction, Request, Response } from 'express';
import {
  ConcurrencyError,
  DomainError,
  ForbiddenError,
  InvalidStateError,
  NotFoundError,
  PaymentRejectedError,
  SoldOutError,
  ValidationError,
} from '../../domain/errors';

/** Maps domain errors to HTTP status codes. */
export function statusFor(err: unknown): number {
  if (err instanceof ValidationError) return 400;
  if (err instanceof PaymentRejectedError) return 402;
  if (err instanceof ForbiddenError) return 403;
  if (err instanceof NotFoundError) return 404;
  if (err instanceof SoldOutError || err instanceof ConcurrencyError || err instanceof InvalidStateError) return 409;
  return 500;
}

// Express recognises error handlers by their 4 parameters.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const status = statusFor(err);
  if (status === 500) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
    return;
  }
  const e = err as DomainError;
  res.status(status).json({ error: e.message, type: e.name });
}
