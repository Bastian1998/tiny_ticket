import { Schema, model } from 'mongoose';

/*
 * Mongoose schemas (persistence only - business rules live in src/domain).
 * Users and tickets use discriminators so each subclass is stored in the
 * same collection with a type field ("role" / "kind").
 */

// ---------- Users ----------
const userSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
  },
  { discriminatorKey: 'role', timestamps: true },
);

export const UserModel = model('User', userSchema, 'users');
export const OrganizerModel = UserModel.discriminator(
  'ORGANIZER',
  new Schema({ organizationName: { type: String } }),
);
export const AttendeeModel = UserModel.discriminator('ATTENDEE', new Schema({}));
export const AdminModel = UserModel.discriminator('ADMIN', new Schema({}));

// ---------- Events ----------
const eventSchema = new Schema(
  {
    _id: { type: String, required: true },
    organizerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    location: { type: String, required: true },
    startsAt: { type: Date, required: true, index: true },
    capacity: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['PUBLISHED', 'CANCELLED', 'REMOVED'], required: true, index: true },
    removalReason: { type: String },
    // Optimistic-locking version, managed by EventRepository (not Mongoose's __v).
    version: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

export const EventModel = model('Event', eventSchema, 'events');

// ---------- Tickets ----------
const ticketSchema = new Schema(
  {
    _id: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    eventId: { type: String, required: true, index: true },
    attendeeId: { type: String, required: true, index: true },
    status: { type: String, enum: ['VALID', 'USED', 'CANCELLED'], required: true },
    price: { type: Number, required: true, default: 0 },
    issuedAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { discriminatorKey: 'kind', timestamps: true },
);

export const TicketModel = model('Ticket', ticketSchema, 'tickets');
export const FreeTicketModel = TicketModel.discriminator('FREE', new Schema({}));
export const PaidTicketModel = TicketModel.discriminator(
  'PAID',
  new Schema({
    paymentId: { type: String, required: true },
    paymentMethod: { type: String, required: true },
  }),
);
