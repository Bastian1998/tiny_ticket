import type {
  AttendeeRow,
  DashboardResponse,
  EventDto,
  EventFormInput,
  PaymentMethod,
  ReservationResponse,
  TicketDto,
  User,
  ValidationResponse,
} from './types';

const SESSION_KEY = 'tinyticket.userId';

export function getSessionUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setSessionUserId(id: string | null): void {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable: session only lasts until reload */
  }
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const userId = getSessionUserId();
  if (userId) headers.set('X-User-Id', userId); // mock login
  const res = await fetch(`/api${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error ?? `Error ${res.status}`, res.status);
  return body as T;
}

const json = (data: unknown) => JSON.stringify(data);

export const api = {
  // Auth (mock)
  listUsers: () => request<User[]>('/auth/users'),
  login: (userId: string) => request<{ user: User }>('/auth/login', { method: 'POST', body: json({ userId }) }),
  me: () => request<User>('/auth/me'),

  // Events
  listEvents: (q?: string) => request<EventDto[]>(`/events${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getEvent: (id: string) => request<EventDto>(`/events/${id}`),
  createEvent: (input: EventFormInput) => request<EventDto>('/events', { method: 'POST', body: json(input) }),
  updateEvent: (id: string, input: EventFormInput) =>
    request<EventDto>(`/events/${id}`, { method: 'PUT', body: json(input) }),
  cancelEvent: (id: string) => request<EventDto>(`/events/${id}/cancel`, { method: 'PATCH' }),
  reserve: (id: string, quantity: number, paymentMethod?: PaymentMethod) =>
    request<ReservationResponse>(`/events/${id}/reservations`, {
      method: 'POST',
      body: json({ quantity, paymentMethod }),
    }),

  // Attendee
  myTickets: () => request<TicketDto[]>('/me/tickets'),

  // Organizer
  dashboard: () => request<DashboardResponse>('/organizer/dashboard'),
  attendees: (eventId: string) =>
    request<{ event: EventDto; attendees: AttendeeRow[] }>(`/organizer/events/${eventId}/attendees`),
  validateTicket: (code: string) =>
    request<ValidationResponse>(`/tickets/${encodeURIComponent(code.trim())}/validate`, { method: 'POST' }),

  // Admin (mock)
  adminEvents: () => request<EventDto[]>('/admin/events'),
  removeEvent: (id: string, reason: string) =>
    request<EventDto>(`/admin/events/${id}/remove`, { method: 'PATCH', body: json({ reason }) }),
};
