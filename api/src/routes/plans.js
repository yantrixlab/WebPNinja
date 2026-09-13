import { Router } from 'express';
import { pool } from '../db.js';

export const plansRouter = Router();

plansRouter.get('/api/plans', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, price_inr, monthly_quota FROM plans ORDER BY price_inr ASC'
    );
    res.json({ plans: rows });
  } catch (err) {
    console.error('[plans]', err.message);
    res.status(500).json({ error: 'Internal error' });
  }
});
