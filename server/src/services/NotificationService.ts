import { Event } from '../domain/events/Event';
import { Ticket } from '../domain/tickets/Ticket';
import { User } from '../domain/users/User';

export interface SentEmail {
  to: string;
  subject: string;
  body: string;
  sentAt: Date;
}

export interface NotificationService {
  sendTicketConfirmation(attendee: User, event: Event, tickets: Ticket[]): Promise<void>;
}

/**
 * MOCK - confirmation emails are not really sent. They are printed to the
 * server console and kept in memory (`outbox`) so the demo/tests can see them.
 */
export class MockEmailNotificationService implements NotificationService {
  readonly outbox: SentEmail[] = [];

  async sendTicketConfirmation(attendee: User, event: Event, tickets: Ticket[]): Promise<void> {
    const codes = tickets.map((t) => t.code).join(', ');
    const email: SentEmail = {
      to: attendee.email,
      subject: `Tus entradas para ${event.title}`,
      body: `Hola ${attendee.name}! Confirmamos ${tickets.length} entrada(s) para "${event.title}" ` +
        `el ${event.startsAt.toLocaleString('es-AR')} en ${event.location}. Codigos: ${codes}`,
      sentAt: new Date(),
    };
    this.outbox.push(email);
    console.info(`[mock email] Para: ${email.to} | ${email.subject} | ${codes}`);
  }
}
