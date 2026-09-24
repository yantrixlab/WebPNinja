import { Router } from 'express';
import { pool } from '../db.js';

export const statsRouter = Router();

const SEED = 4049;
let memoryCounter = SEED; // fallback when DB is unreachable
let useDb = false;

pool
  .query('SELECT total_images FROM stats WHERE id = 1')
  .then(({ rows }) => {
    useDb = true;
    memoryCounter = Number(rows[0]?.total_images ?? SEED);
    console.log(`DB connected — total_images: ${memoryCounter}`);
  })
  .catch((err) => {
    console.warn(`DB unavailable (${err.message}) — using in-memory counter starting at ${SEED}`);
  });

/* Active SSE clients */
const clients = new Set();

function broadcast(value) {
  const msg = `data: ${value}\n\n`;
  for (const client of clients) {
    try {
      client.write(msg);
    } catch {
      clients.delete(client);
    }
  }
}

statsRouter.get('/api/stats', async (_req, res) => {
  if (!useDb) return res.json({ total_images: memoryCounter });
  try {
    const { rows } = await pool.query('SELECT total_images FROM stats WHERE id = 1');
    res.json({ total_images: rows[0]?.total_images ?? memoryCounter });
  } catch (err) {
    console.error('[stats]', err.message);
    res.json({ total_images: memoryCounter });
  }
});

/**
 * Adds `n` to the public "images compressed" counter and pushes the new
 * total to every open live-counter stream. Shared by the browser tool's
 * increment endpoint, the Developer API and (opt-in) WordPress plugin
 * reports. Never throws — a counter hiccup must not fail a compression.
 */
export async function incrementGlobalCounter(n) {
  if (!useDb) {
    memoryCounter += n;
    broadcast(memoryCounter);
    return memoryCounter;
  }
  try {
    const { rows } = await pool.query(
      'UPDATE stats SET total_images = total_images + $1 WHERE id = 1 RETURNING total_images',
      [n]
    );
    memoryCounter = Number(rows[0]?.total_images ?? memoryCounter);
  } catch (err) {
    console.error('[increment]', err.message);
    memoryCounter += n;
  }
  broadcast(memoryCounter);
  return memoryCounter;
}

// Called by the browser tool after each image, and by WordPress sites whose
// owner opted in to sharing a compression count (batched hourly, up to 1000).
statsRouter.post('/api/stats/increment', async (req, res) => {
  const n = parseInt(req.body?.count ?? 1, 10);
  if (!Number.isFinite(n) || n < 1 || n > 1000) {
    return res.status(400).json({ error: 'invalid count' });
  }
  res.json({ total_images: await incrementGlobalCounter(n) });
});

statsRouter.get('/api/stats/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});
