import { PaymentStrategyFactory } from './domain/payments/PaymentStrategyFactory';
import { QrCodeGenerator } from './infrastructure/qr/QrCodeGenerator';
import { EventRepository } from './infrastructure/repositories/EventRepository';
import { TicketRepository } from './infrastructure/repositories/TicketRepository';
import { UserRepository } from './infrastructure/repositories/UserRepository';
import { EventService } from './services/EventService';
import { ModerationService } from './services/ModerationService';
import { MockEmailNotificationService, NotificationService } from './services/NotificationService';
import { OrganizerDashboardService } from './services/OrganizerDashboardService';
import { ReservationService } from './services/ReservationService';
import { TicketQueryService } from './services/TicketQueryService';
import { TicketValidationService } from './services/TicketValidationService';

/** Composition root: builds every object once and wires the dependencies. */
export interface Container {
  users: UserRepository;
  events: EventRepository;
  tickets: TicketRepository;
  qr: QrCodeGenerator;
  notifier: NotificationService;
  eventService: EventService;
  reservationService: ReservationService;
  dashboardService: OrganizerDashboardService;
  moderationService: ModerationService;
  validationService: TicketValidationService;
  ticketQueryService: TicketQueryService;
}

export function createContainer(overrides: { paymentFactory?: PaymentStrategyFactory; notifier?: NotificationService } = {}): Container {
  const users = new UserRepository();
  const events = new EventRepository();
  const tickets = new TicketRepository();
  const notifier = overrides.notifier ?? new MockEmailNotificationService();
  const paymentFactory = overrides.paymentFactory ?? new PaymentStrategyFactory();

  return {
    users,
    events,
    tickets,
    qr: new QrCodeGenerator(),
    notifier,
    eventService: new EventService(events, users),
    reservationService: new ReservationService(events, tickets, paymentFactory, notifier),
    dashboardService: new OrganizerDashboardService(events, tickets, users),
    moderationService: new ModerationService(events),
    validationService: new TicketValidationService(tickets, events, users),
    ticketQueryService: new TicketQueryService(tickets, events),
  };
}
