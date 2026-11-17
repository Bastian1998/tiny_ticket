import { Ticket, TicketKind, TicketProps } from './Ticket';

/** Ticket for a free event (simple reservation). */
export class FreeTicket extends Ticket {
  constructor(props: TicketProps) {
    super(props);
  }

  get kind(): TicketKind {
    return 'FREE';
  }

  getPrice(): number {
    return 0;
  }
}
