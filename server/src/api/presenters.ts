import { Event, EventDetailsInput } from '../domain/events/Event';
import { ValidationError } from '../domain/errors';
import { Ticket } from '../domain/tickets/Ticket';
import { PaidTicket } from '../domain/tickets/PaidTicket';
import { QrCodeGenerator } from '../infrastructure/qr/QrCodeGenerator';

/** JSON shapes sent to the client (keeps domain objects out of the HTTP contract). */

export function presentEvent(event: Event, organizerName?: string) {
  return {
    id: event.id,
    organizerId: event.organizerId,
    organizerName,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.startsAt.toISOString(),
    capacity: event.capacity,
    availableSeats: event.availableSeats,
    soldSeats: event.soldSeats,
    price: event.price,
    isFree: event.isFree(),
    isSoldOut: event.isSoldOut(),
    isBookable: event.isBookable(),
    status: event.status,
    removalReason: event.removalReason,
  };
}

export async function presentTicket(ticket: Ticket, qr: QrCodeGenerator, event?: Event | null) {
  return {
    id: ticket.id,
    code: ticket.code,
    kind: ticket.kind,
    price: ticket.getPrice(),
    status: ticket.status,
    issuedAt: ticket.issuedAt.toISOString(),
    usedAt: ticket.usedAt?.toISOString(),
    paymentMethod: ticket instanceof PaidTicket ? ticket.paymentMethod : undefined,
    qrDataUrl: await qr.toDataUrl(ticket.code),
    event: event ? presentEvent(event) : undefined,
  };
}

/** Parses the create/edit form body into domain input (types only; rules live in Event). */
export function parseEventInput(body: unknown): EventDetailsInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const startsAt = new Date(String(b.startsAt ?? ''));
  const capacity = Number(b.capacity);
  const price = b.price === undefined || b.price === '' ? 0 : Number(b.price);
  if (Number.isNaN(capacity)) throw new ValidationError('El cupo debe ser un numero');
  if (Number.isNaN(price)) throw new ValidationError('El precio debe ser un numero');
  return {
    title: String(b.title ?? ''),
    description: String(b.description ?? ''),
    location: String(b.location ?? ''),
    startsAt,
    capacity,
    price,
  };
}
