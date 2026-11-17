import { InvalidStateError } from '../errors';

export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED';
export type TicketKind = 'FREE' | 'PAID';

export interface TicketProps {
  id: string;
  /** Unique code printed in the QR. */
  code: string;
  eventId: string;
  attendeeId: string;
  status: TicketStatus;
  issuedAt: Date;
  usedAt?: Date;
}

/** Persisted shape of any ticket (paid fields are only present for PAID tickets). */
export interface TicketSnapshot extends TicketProps {
  kind: TicketKind;
  price: number;
  paymentId?: string;
  paymentMethod?: string;
}

/**
 * Base class of the ticket hierarchy (inheritance).
 * Subclasses: FreeTicket, PaidTicket. getPrice() and kind are polymorphic.
 */
export abstract class Ticket {
  readonly id: string;
  readonly code: string;
  readonly eventId: string;
  readonly attendeeId: string;
  readonly issuedAt: Date;
  private _status: TicketStatus;
  private _usedAt?: Date;

  protected constructor(props: TicketProps) {
    this.id = props.id;
    this.code = props.code;
    this.eventId = props.eventId;
    this.attendeeId = props.attendeeId;
    this.issuedAt = props.issuedAt;
    this._status = props.status;
    this._usedAt = props.usedAt;
  }

  abstract get kind(): TicketKind;

  /** Amount paid for this ticket. */
  abstract getPrice(): number;

  get status(): TicketStatus {
    return this._status;
  }

  get usedAt(): Date | undefined {
    return this._usedAt;
  }

  isValid(): boolean {
    return this._status === 'VALID';
  }

  /** Marks the ticket as used at the door. A ticket can only be used once. */
  markUsed(now: Date = new Date()): void {
    if (this._status === 'USED') {
      throw new InvalidStateError('La entrada ya fue utilizada');
    }
    if (this._status !== 'VALID') {
      throw new InvalidStateError(`La entrada no es valida (estado ${this._status})`);
    }
    this._status = 'USED';
    this._usedAt = now;
  }

  toSnapshot(): TicketSnapshot {
    return {
      id: this.id,
      code: this.code,
      eventId: this.eventId,
      attendeeId: this.attendeeId,
      status: this._status,
      issuedAt: this.issuedAt,
      usedAt: this._usedAt,
      kind: this.kind,
      price: this.getPrice(),
    };
  }
}
