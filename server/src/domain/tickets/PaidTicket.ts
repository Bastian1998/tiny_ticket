import { Ticket, TicketKind, TicketProps, TicketSnapshot } from './Ticket';

export interface PaidTicketProps extends TicketProps {
  price: number;
  paymentId: string;
  paymentMethod: string;
}

/** Ticket bought through the app. Keeps the price and the payment reference. */
export class PaidTicket extends Ticket {
  readonly price: number;
  readonly paymentId: string;
  readonly paymentMethod: string;

  constructor(props: PaidTicketProps) {
    super(props);
    this.price = props.price;
    this.paymentId = props.paymentId;
    this.paymentMethod = props.paymentMethod;
  }

  get kind(): TicketKind {
    return 'PAID';
  }

  getPrice(): number {
    return this.price;
  }

  override toSnapshot(): TicketSnapshot {
    return { ...super.toSnapshot(), paymentId: this.paymentId, paymentMethod: this.paymentMethod };
  }
}
