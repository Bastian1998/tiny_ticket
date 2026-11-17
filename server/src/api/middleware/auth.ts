import { NextFunction, Request, Response } from 'express';
import { Action, User } from '../../domain/users/User';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const USER_HEADER = 'x-user-id';

/**
 * MOCK LOGIN - there are no passwords in the MVP. The client picks one of the
 * preloaded users and sends its id in the "X-User-Id" header on every request.
 */
export function authenticate(users: UserRepository) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const id = req.header(USER_HEADER);
    if (!id) {
      res.status(401).json({ error: 'Inicia sesion para continuar' });
      return;
    }
    const user = await users.findById(id);
    if (!user) {
      res.status(401).json({ error: 'Usuario inexistente' });
      return;
    }
    req.user = user;
    next();
  };
}

/** Lets the request through only if the user's role can do `action` (polymorphic `can()`). */
export function requirePermission(action: Action) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.can(action)) {
      res.status(403).json({ error: 'No tenes permiso para esta accion' });
      return;
    }
    next();
  };
}

export function currentUser(req: Request): User {
  if (!req.user) throw new Error('authenticate() middleware missing');
  return req.user;
}
