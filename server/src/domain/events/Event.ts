import { randomUUID } from 'crypto';
import { InvalidStateError, SoldOutError, ValidationError } from '../errors';

export type EventStatus = 'PUBLISHED' | 'CANCELLED' | 'REMOVED';

/** Full state of an event, as stored in the database. */
export interface EventSnapshot {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  capacity: number;
  availableSeats: number;
  price: number;
  status: EventStatus;
  removalReason?: string;
  version: number;
}

/** Data an organizer sends to create or edit an event. */
export interface EventDetailsInput {
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  capacity: number;
  /** 0 means free entry. */
  price: number;
}

export const MAX_CAPACITY = 100_000;

/**
 * Event aggregate.
 *
 * Encapsulation: capacity, availableSeats and status are private. Nobody outside
 * this class can change them directly; they only change through
 * reserveSeats(), releaseSeats(), changeCapacity(), cancel() and remove(),
 * which enforce the invariant  0 <= availableSeats <= capacity.
 */
export class Event {
  private readonly _id: string;
  private readonly _organizerId: string;
  private _title: string;
  private _description: string;
  private _location: string;
  private _startsAt: Date;
  private _capacity: number;
  private _availableSeats: number;
  private _price: number;
  private _status: EventStatus;
  private _removalReason?: string;
  private readonly _version: number;

  private constructor(s: EventSnapshot) {
    this._id = s.id;
    this._organizerId = s.organizerId;
    this._title = s.title;
    this._description = s.description;
    this._location = s.location;
    this._startsAt = s.startsAt;
    this._capacity = s.capacity;
    this._availableSeats = s.availableSeats;
    this._price = s.price;
    this._status = s.status;
    this._removalReason = s.removalReason;
    this._version = s.version;
  }

  /** Creates a new, published event. All seats start available. */
  static create(organizerId: string, input: EventDetailsInput, now: Date = new Date()): Event {
    Event.validateDetails(input, now);
    return new Event({
      id: randomUUID(),
      organizerId,
      title: input.title.trim(),
      description: input.description.trim(),
      location: input.location.trim(),
      startsAt: input.startsAt,
      capacity: input.capacity,
      availableSeats: input.capacity,
      price: input.price,
      status: 'PUBLISHED',
      version: 0,
    });
  }

  /** Rebuilds an event from persisted state (used by the repository). */
  static restore(snapshot: EventSnapshot): Event {
    return new Event({ ...snapshot });
  }

  // ---------- Getters (read-only access) ----------
  get id(): string { return this._id; }
  get organizerId(): string { return this._organizerId; }
  get title(): string { return this._title; }
  get description(): string { return this._description; }
  get location(): string { return this._location; }
  get startsAt(): Date { return this._startsAt; }
  get capacity(): number { return this._capacity; }
  get availableSeats(): number { return this._availableSeats; }
  get price(): number { return this._price; }
  get status(): EventStatus { return this._status; }
  get removalReason(): string | undefined { return this._removalReason; }
  /** Optimistic-locking version: bumped by the repository on every successful save. */
  get version(): number { return this._version; }

  get soldSeats(): number {
    return this._capacity - this._availableSeats;
  }

  isFree(): boolean {
    return this._price === 0;
  }

  isSoldOut(): boolean {
    return this._availableSeats === 0;
  }

  isOwnedBy(userId: string): boolean {
    return this._organizerId === userId;
  }

  /** Tickets can be reserved only for published events that have not started yet. */
  isBookable(now: Date = new Date()): boolean {
    return this._status === 'PUBLISHED' && this._startsAt.getTime() > now.getTime();
  }

  // ---------- Seat management: the ONLY way seats change ----------

  /** Takes `quantity` seats. Throws SoldOutError if not enough are left. */
  reserveSeats(quantity: number, now: Date = new Date()): void {
    Event.assertPositiveInteger(quantity, 'La cantidad');
    if (!this.isBookable(now)) {
      throw new InvalidStateError('El evento no admite reservas (no esta publicado o ya comenzo)');
    }
    if (quantity > this._availableSeats) {
      throw new SoldOutError(
        `No hay cupo suficiente: quedan ${this._availableSeats} y se pidieron ${quantity}`,
      );
    }
    this._availableSeats -= quantity;
  }

  /** Gives back `quantity` seats (e.g. when a payment is rejected). */
  releaseSeats(quantity: number): void {
    Event.assertPositiveInteger(quantity, 'La cantidad');
    if (quantity > this.soldSeats) {
      throw new InvalidStateError('No se pueden liberar mas lugares de los vendidos');
    }
    this._availableSeats += quantity;
  }

  /** Changes the total capacity. It can never go below the seats already sold. */
  changeCapacity(newCapacity: number): void {
    Event.assertCapacity(newCapacity);
    if (newCapacity < this.soldSeats) {
      throw new ValidationError(
        `El cupo no puede ser menor a las entradas ya emitidas (${this.soldSeats})`,
      );
    }
    this._availableSeats = newCapacity - this.soldSeats;
    this._capacity = newCapacity;
  }

  /** Edits title, description, place, date, price and capacity. */
  updateDetails(input: EventDetailsInput, now: Date = new Date()): void {
    this.assertEditable();
    Event.validateDetails(input, now);
    if (input.price !== this._price && this.soldSeats > 0) {
      throw new ValidationError('No se puede cambiar el precio de un evento con entradas emitidas');
    }
    this._title = input.title.trim();
    this._description = input.description.trim();
    this._location = input.location.trim();
    this._startsAt = input.startsAt;
    this._price = input.price;
    this.changeCapacity(input.capacity);
  }

  /** The organizer cancels the event. */
  cancel(): void {
    this.assertEditable();
    this._status = 'CANCELLED';
  }

  /** An administrator takes the event down (moderation). */
  remove(reason: string): void {
    if (this._status === 'REMOVED') {
      throw new InvalidStateError('El evento ya fue dado de baja');
    }
    this._status = 'REMOVED';
    this._removalReason = reason.trim() || 'Contenido inapropiado';
  }

  toSnapshot(): EventSnapshot {
    return {
      id: this._id,
      organizerId: this._organizerId,
      title: this._title,
      description: this._description,
      location: this._location,
      startsAt: this._startsAt,
      capacity: this._capacity,
      availableSeats: this._availableSeats,
      price: this._price,
      status: this._status,
      removalReason: this._removalReason,
      version: this._version,
    };
  }

  // ---------- Private validation helpers ----------

  private assertEditable(): void {
    if (this._status !== 'PUBLISHED') {
      throw new InvalidStateError(`No se puede modificar un evento en estado ${this._status}`);
    }
  }

  private static validateDetails(input: EventDetailsInput, now: Date): void {
    if (!input.title || !input.title.trim()) throw new ValidationError('El titulo es obligatorio');
    if (!input.location || !input.location.trim()) throw new ValidationError('La ubicacion es obligatoria');
    if (!(input.startsAt instanceof Date) || Number.isNaN(input.startsAt.getTime())) {
      throw new ValidationError('La fecha y hora no son validas');
    }
    if (input.startsAt.getTime() <= now.getTime()) {
      throw new ValidationError('La fecha del evento debe ser futura');
    }
    Event.assertCapacity(input.capacity);
    if (typeof input.price !== 'number' || !Number.isFinite(input.price) || input.price < 0) {
      throw new ValidationError('El precio debe ser 0 (gratuito) o un numero positivo');
    }
  }

  private static assertCapacity(capacity: number): void {
    Event.assertPositiveInteger(capacity, 'El cupo');
    if (capacity > MAX_CAPACITY) {
      throw new ValidationError(`El cupo maximo es ${MAX_CAPACITY}`);
    }
  }

  private static assertPositiveInteger(value: number, label: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new ValidationError(`${label} debe ser un entero mayor a 0`);
    }
  }
}
