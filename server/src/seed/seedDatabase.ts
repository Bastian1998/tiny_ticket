import { Container } from '../container';
import { Event, EventDetailsInput } from '../domain/events/Event';
import { Admin } from '../domain/users/Admin';
import { Attendee } from '../domain/users/Attendee';
import { Organizer } from '../domain/users/Organizer';

const DAY = 24 * 60 * 60 * 1000;

function inDays(days: number, hour: number): Date {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** Preloaded users (the login is mocked: you pick one of these). */
export const SEED_USERS = {
  organizers: [
    new Organizer({ id: 'org-lucia', name: 'Lucia Fernandez', email: 'lucia@galeriasur.com', organizationName: 'Galeria Sur' }),
    new Organizer({ id: 'org-martin', name: 'Martin Rios', email: 'martin@barelfaro.com', organizationName: 'Bar El Faro' }),
  ],
  attendees: [
    new Attendee({ id: 'att-sofia', name: 'Sofia Gomez', email: 'sofia@mail.com' }),
    new Attendee({ id: 'att-tomas', name: 'Tomas Diaz', email: 'tomas@mail.com' }),
    new Attendee({ id: 'att-valen', name: 'Valentina Paz', email: 'valen@mail.com' }),
  ],
  admins: [new Admin({ id: 'adm-root', name: 'Admin TinyTicket', email: 'admin@tinyticket.app' })],
};

const SEED_EVENTS: { organizerId: string; input: EventDetailsInput }[] = [
  {
    organizerId: 'org-lucia',
    input: {
      title: 'Muestra de arte emergente',
      description: 'Inauguracion de la muestra colectiva de artistas locales. Entrada libre con reserva.',
      location: 'Galeria Sur - Defensa 1200, CABA',
      startsAt: inDays(5, 19),
      capacity: 60,
      price: 0,
    },
  },
  {
    organizerId: 'org-lucia',
    input: {
      title: 'Taller de grabado',
      description: 'Taller practico de grabado en linoleo. Materiales incluidos. Cupo muy limitado.',
      location: 'Galeria Sur - Sala 2',
      startsAt: inDays(9, 15),
      capacity: 4,
      price: 8000,
    },
  },
  {
    organizerId: 'org-martin',
    input: {
      title: 'Jazz en vivo: Trio Cardinal',
      description: 'Noche de jazz con el Trio Cardinal. Mesas por orden de llegada.',
      location: 'Bar El Faro - Av. Corrientes 3400, CABA',
      startsAt: inDays(3, 21),
      capacity: 40,
      price: 6500,
    },
  },
  {
    organizerId: 'org-martin',
    input: {
      title: 'Open mic de stand-up',
      description: 'Microfono abierto para comediantes nuevos. Gratis, a la gorra para los artistas.',
      location: 'Bar El Faro - Patio',
      startsAt: inDays(12, 22),
      capacity: 80,
      price: 0,
    },
  },
];

/** Wipes the database and loads demo users, events and a few reservations. */
export async function seedDatabase(c: Container): Promise<{ events: Event[] }> {
  await Promise.all([c.tickets.deleteAll(), c.events.deleteAll(), c.users.deleteAll()]);

  const allUsers = [...SEED_USERS.organizers, ...SEED_USERS.attendees, ...SEED_USERS.admins];
  for (const user of allUsers) await c.users.save(user);

  const events: Event[] = [];
  for (const { organizerId, input } of SEED_EVENTS) {
    const organizer = SEED_USERS.organizers.find((o) => o.id === organizerId)!;
    events.push(await c.eventService.create(organizer, input));
  }

  // A few reservations so the organizer dashboard is not empty.
  const [sofia, tomas, valen] = SEED_USERS.attendees;
  const [muestra, taller, jazz] = events;
  await c.reservationService.reserve(sofia, { eventId: muestra.id, quantity: 2 });
  await c.reservationService.reserve(tomas, { eventId: jazz.id, quantity: 2, paymentMethod: 'MERCADO_PAGO' });
  await c.reservationService.reserve(valen, { eventId: taller.id, quantity: 3, paymentMethod: 'CARD' });

  return { events };
}
