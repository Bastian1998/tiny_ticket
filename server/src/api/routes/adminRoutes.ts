import { Router } from 'express';
import { Container } from '../../container';
import { authenticate, currentUser, requirePermission } from '../middleware/auth';
import { presentEvent } from '../presenters';

/** MOCK moderation (admin). */
export function adminRoutes(c: Container): Router {
  const router = Router();
  router.use(authenticate(c.users), requirePermission('MODERATE_EVENT'));

  router.get('/events', async (req, res) => {
    const events = await c.moderationService.listAll(currentUser(req));
    res.json(events.map((e) => presentEvent(e)));
  });

  router.patch('/events/:id/remove', async (req, res) => {
    const event = await c.moderationService.removeEvent(
      currentUser(req),
      String(req.params.id),
      String(req.body?.reason ?? ''),
    );
    res.json(presentEvent(event));
  });

  return router;
}
