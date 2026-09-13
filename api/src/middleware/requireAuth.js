import { verifySession } from '../lib/jwt.js';

/** Verifies the dashboard session JWT (Authorization: Bearer <jwt>). */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? verifySession(token) : null;

  if (!payload) {
    return res.status(401).json({ error: 'Missing or invalid session' });
  }

  req.userId = payload.sub;
  next();
}
