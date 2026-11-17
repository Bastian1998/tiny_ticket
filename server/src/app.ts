import cors from 'cors';
import express, { Express } from 'express';
import { Container } from './container';
import { errorHandler } from './api/middleware/errorHandler';
import { adminRoutes } from './api/routes/adminRoutes';
import { authRoutes } from './api/routes/authRoutes';
import { eventRoutes } from './api/routes/eventRoutes';
import { meRoutes } from './api/routes/meRoutes';
import { organizerRoutes } from './api/routes/organizerRoutes';
import { ticketRoutes } from './api/routes/ticketRoutes';

/** Builds the Express app. Express 5 forwards errors thrown in async handlers to errorHandler. */
export function createApp(c: Container): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', authRoutes(c));
  app.use('/api/events', eventRoutes(c));
  app.use('/api/me', meRoutes(c));
  app.use('/api/organizer', organizerRoutes(c));
  app.use('/api/admin', adminRoutes(c));
  app.use('/api/tickets', ticketRoutes(c));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Ruta inexistente' });
  });
  app.use(errorHandler);
  return app;
}
