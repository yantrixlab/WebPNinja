/**
 * Minimal in-memory sliding-window rate limiter, keyed by req.ip. Good enough
 * for a single API process; if this ever runs behind a load balancer across
 * multiple instances, swap the Map for a shared store (e.g. Redis).
 */
const buckets = new Map();

export function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

    if (recent.length >= max) {
      return res.status(429).json({ error: 'Too many requests — please try again shortly' });
    }

    recent.push(now);
    buckets.set(key, recent);
    next();
  };
}

// Periodic sweep so the map doesn't grow unbounded with stale IPs.
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of buckets) {
    const recent = times.filter((t) => now - t < 15 * 60 * 1000);
    if (recent.length) buckets.set(key, recent);
    else buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();
