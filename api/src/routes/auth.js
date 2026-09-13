import { Router } from 'express';
import { pool } from '../db.js';
import { verifyGoogleIdToken } from '../lib/google.js';
import { signSession } from '../lib/jwt.js';

export const authRouter = Router();

authRouter.post('/api/auth/google', async (req, res) => {
  const { idToken } = req.body ?? {};
  if (!idToken) {
    return res.status(400).json({ error: 'Missing idToken' });
  }

  let profile;
  try {
    profile = await verifyGoogleIdToken(idToken);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid Google token', detail: err.message });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (google_sub, email, name, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_sub) DO UPDATE
         SET email = EXCLUDED.email, name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
       RETURNING id, email, name, avatar_url`,
      [profile.googleSub, profile.email, profile.name, profile.avatarUrl]
    );
    const user = rows[0];

    await pool.query(
      `INSERT INTO subscriptions (user_id, plan_id, status)
       SELECT $1, 'free', 'active'
       WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = $1 AND status = 'active')`,
      [user.id]
    );

    const token = signSession(user);
    res.json({ token, user });
  } catch (err) {
    console.error('[auth/google]', err.message);
    res.status(500).json({ error: 'Internal error during sign-in' });
  }
});
