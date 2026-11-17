import { Ticket, TicketSnapshot } from '../../domain/tickets/Ticket';
import { TicketFactory } from '../../domain/tickets/TicketFactory';
import { TicketModel } from '../db/models';

interface TicketDoc extends Omit<TicketSnapshot, 'id'> {
  _id: string;
}

export class TicketRepository {
  async insertMany(tickets: Ticket[]): Promise<void> {
    if (tickets.length === 0) return;
    const docs = tickets.map((t) => {
      const { id, ...rest } = t.toSnapshot();
      return { _id: id, ...rest };
    });
    // Bypass the discriminator models so each doc keeps its own "kind".
    await TicketModel.collection.insertMany(docs as never[]);
  }

  async findByCode(code: string): Promise<Ticket | null> {
    const doc = await TicketModel.findOne({ code: code.trim().toUpperCase() }).lean<TicketDoc>();
    return doc ? this.toDomain(doc) : null;
  }

  async findByAttendee(attendeeId: string): Promise<Ticket[]> {
    const docs = await TicketModel.find({ attendeeId }).sort({ issuedAt: -1 }).lean<TicketDoc[]>();
    return docs.map((d) => this.toDomain(d));
  }

  async findByEvents(eventIds: string[]): Promise<Ticket[]> {
    const docs = await TicketModel.find({ eventId: { $in: eventIds } }).sort({ issuedAt: 1 }).lean<TicketDoc[]>();
    return docs.map((d) => this.toDomain(d));
  }

  async countByEvent(eventId: string): Promise<number> {
    return TicketModel.countDocuments({ eventId });
  }

  /**
   * Saves a ticket marked as USED only if it was still VALID in the database,
   * so the same ticket can never be accepted twice at the door.
   */
  async saveUsedIfStillValid(ticket: Ticket): Promise<boolean> {
    const result = await TicketModel.updateOne(
      { _id: ticket.id, status: 'VALID' },
      { $set: { status: ticket.status, usedAt: ticket.usedAt } },
    );
    return result.modifiedCount === 1;
  }

  async deleteAll(): Promise<void> {
    await TicketModel.deleteMany({});
  }

  private toDomain(doc: TicketDoc): Ticket {
    const { _id, ...rest } = doc;
    return TicketFactory.restore({
      id: _id,
      code: rest.code,
      eventId: rest.eventId,
      attendeeId: rest.attendeeId,
      status: rest.status,
      issuedAt: new Date(rest.issuedAt),
      usedAt: rest.usedAt ? new Date(rest.usedAt) : undefined,
      kind: rest.kind,
      price: rest.price ?? 0,
      paymentId: rest.paymentId,
      paymentMethod: rest.paymentMethod,
    });
  }
}
