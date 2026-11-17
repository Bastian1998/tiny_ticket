export type Role = 'ORGANIZER' | 'ATTENDEE' | 'ADMIN';
export type PaymentMethod = 'MERCADO_PAGO' | 'CARD';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationName?: string;
}

export interface EventDto {
  id: string;
  organizerId: string;
  organizerName?: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  capacity: number;
  availableSeats: number;
  soldSeats: number;
  price: number;
  isFree: boolean;
  isSoldOut: boolean;
  isBookable: boolean;
  status: 'PUBLISHED' | 'CANCELLED' | 'REMOVED';
  removalReason?: string;
}

export interface TicketDto {
  id: string;
  code: string;
  kind: 'FREE' | 'PAID';
  price: number;
  status: 'VALID' | 'USED' | 'CANCELLED';
  issuedAt: string;
  usedAt?: string;
  paymentMethod?: string;
  qrDataUrl: string;
  event?: EventDto;
}

export interface ReservationResponse {
  total: number;
  transactionId: string;
  tickets: TicketDto[];
}

export interface DashboardEvent extends EventDto {
  ticketsIssued: number;
  ticketsUsed: number;
  revenue: number;
  occupancy: number;
}

export interface DashboardResponse {
  totals: { events: number; ticketsIssued: number; revenue: number };
  events: DashboardEvent[];
}

export interface AttendeeRow {
  attendeeId: string;
  name: string;
  email: string;
  tickets: { code: string; status: string; issuedAt: string }[];
}

export interface EventFormInput {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  capacity: number;
  price: number;
}

export interface ValidationResponse {
  ticket: TicketDto;
  event: EventDto;
  attendeeName: string;
}
