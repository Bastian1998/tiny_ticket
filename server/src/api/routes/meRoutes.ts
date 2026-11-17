import { Router } from 'express';
import { Container } from '../../container';
import { authenticate, currentUser, requirePermission } from '../middleware/auth';
import { presentTicket } from '../presenters';

export function meRoutes(c: Container): Router {
  const router = Router();
  router.use(authenticate(c.users));

  router.get('/tickets', requirePermission('VIEW_OWN_TICKETS'), async (req, res) => {
    const list = await c.ticketQueryService.listForAttendee(currentUser(req));
    res.json(await Promise.all(list.map(({ ticket, event }) => presentTicket(ticket, c.qr, event))));
  });

  return router;
}
