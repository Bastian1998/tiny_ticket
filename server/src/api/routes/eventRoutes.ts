import { Router } from 'express';
import { Container } from '../../container';
import { PaymentStrategyFactory } from '../../domain/payments/PaymentStrategyFactory';
import { ValidationError } from '../../domain/errors';
import { authenticate, currentUser, requirePermission } from '../middleware/auth';
import { parseEventInput, presentEvent, presentTicket } from '../presenters';

export function eventRoutes(c: Container): Router {
  const router = Router();
  const auth = authenticate(c.users);

  // Public catalogue
  router.get('/', async (req, res) => {
    const search = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : undefined;
    const views = await c.eventService.listPublic(search);
    res.json(views.map((v) => presentEvent(v.event, v.organizerName)));
  });

  router.get('/:id', async (req, res) => {
    const view = await c.eventService.getDetail(String(req.params.id));
    res.json(presentEvent(view.event, view.organizerName));
  });

  // Organizer: publish / edit / cancel
  router.post('/', auth, requirePermission('CREATE_EVENT'), async (req, res) => {
    const event = await c.eventService.create(currentUser(req), parseEventInput(req.body));
    res.status(201).json(presentEvent(event));
  });

  router.put('/:id', auth, requirePermission('EDIT_EVENT'), async (req, res) => {
    const event = await c.eventService.update(currentUser(req), String(req.params.id), parseEventInput(req.body));
    res.json(presentEvent(event));
  });

  router.patch('/:id/cancel', auth, requirePermission('EDIT_EVENT'), async (req, res) => {
    const event = await c.eventService.cancel(currentUser(req), String(req.params.id));
    res.json(presentEvent(event));
  });

  // Attendee: reserve (free) or buy (paid)
  router.post('/:id/reservations', auth, requirePermission('RESERVE_TICKET'), async (req, res) => {
    const method = req.body?.paymentMethod;
    if (method !== undefined && !PaymentStrategyFactory.isPaymentMethod(method)) {
      throw new ValidationError('Medio de pago invalido');
    }
    const result = await c.reservationService.reserve(currentUser(req), {
      eventId: String(req.params.id),
      quantity: Number(req.body?.quantity ?? 1),
      paymentMethod: method,
    });
    res.status(201).json({
      total: result.total,
      transactionId: result.transactionId,
      tickets: await Promise.all(result.tickets.map((t) => presentTicket(t, c.qr))),
    });
  });

  return router;
}
