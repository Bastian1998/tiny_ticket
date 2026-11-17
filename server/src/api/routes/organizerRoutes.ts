import { Router } from 'express';
import { Container } from '../../container';
import { authenticate, currentUser, requirePermission } from '../middleware/auth';
import { presentEvent } from '../presenters';

export function organizerRoutes(c: Container): Router {
  const router = Router();
  router.use(authenticate(c.users), requirePermission('VIEW_DASHBOARD'));

  router.get('/dashboard', async (req, res) => {
    const d = await c.dashboardService.getDashboard(currentUser(req));
    res.json({
      totals: d.totals,
      events: d.events.map((s) => ({
        ...presentEvent(s.event),
        ticketsIssued: s.ticketsIssued,
        ticketsUsed: s.ticketsUsed,
        revenue: s.revenue,
        occupancy: s.occupancy,
      })),
    });
  });

  router.get('/events/:id/attendees', async (req, res) => {
    const { event, attendees } = await c.dashboardService.getAttendees(currentUser(req), String(req.params.id));
    res.json({ event: presentEvent(event), attendees });
  });

  return router;
}
