import { Router } from 'express';
import { Container } from '../../container';
import { authenticate, currentUser } from '../middleware/auth';

/** MOCK login: list the preloaded users and "log in" as one of them. */
export function authRoutes(c: Container): Router {
  const router = Router();

  router.get('/users', async (_req, res) => {
    const users = await c.users.findAll();
    res.json(users.map((u) => u.toJSON()));
  });

  router.post('/login', async (req, res) => {
    const user = await c.users.findById(String(req.body?.userId ?? ''));
    if (!user) {
      res.status(401).json({ error: 'Usuario inexistente' });
      return;
    }
    res.json({ user: user.toJSON(), token: user.id });
  });

  router.get('/me', authenticate(c.users), (req, res) => {
    res.json(currentUser(req).toJSON());
  });

  return router;
}
