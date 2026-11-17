import { Router } from 'express';
import { Container } from '../../container';
import { authenticate, currentUser, requirePermission } from '../middleware/auth';
import { presentEvent, presentTicket } from '../presenters';

/** MOCK door check: validate a ticket code once. */
export function ticketRoutes(c: Container): Router {
  const router = Router();

  router.post('/:code/validate', authenticate(c.users), requirePermission('VALIDATE_TICKET'), async (req, res) => {
    const outcome = await c.validationService.validate(currentUser(req), String(req.params.code));
    res.json({
      ticket: await presentTicket(outcome.ticket, c.qr),
      event: presentEvent(outcome.event),
      attendeeName: outcome.attendeeName,
    });
  });

  return router;
}
