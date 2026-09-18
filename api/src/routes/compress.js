import { Router } from 'express';
import multer from 'multer';
import { requireApiKey, incrementUsage } from '../middleware/requireApiKey.js';
import { SUPPORTED_FORMATS } from '../lib/compress.js';
import { compressImageIsolated } from '../lib/compressPool.js';
import { rateLimit } from '../lib/rateLimiter.js';

// Hard ceiling across all plans; the actual per-plan limit is enforced below
// once we know which plan the API key belongs to.
const HARD_MAX_UPLOAD_MB = 200;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: HARD_MAX_UPLOAD_MB * 1024 * 1024 } });

export const compressRouter = Router();

compressRouter.post('/api/v1/compress', requireApiKey, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `File exceeds the maximum upload size of ${HARD_MAX_UPLOAD_MB} MB` });
    }
    if (err) return next(err);
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Missing file (multipart field "file")' });
  }

  const maxUploadMb = req.plan.maxUploadMb;
  if (req.file.size > maxUploadMb * 1024 * 1024) {
    return res.status(413).json({
      error: `File exceeds your ${req.plan.id} plan's ${maxUploadMb} MB upload limit`,
      maxUploadMb,
      fileSizeMb: Number((req.file.size / (1024 * 1024)).toFixed(2)),
    });
  }

  const format = (req.body.format ?? '').toLowerCase();
  if (!SUPPORTED_FORMATS.includes(format)) {
    return res.status(400).json({ error: `format must be one of: ${SUPPORTED_FORMATS.join(', ')}` });
  }

  const quality = req.body.quality ? Number(req.body.quality) : 80;
  if (!Number.isFinite(quality) || quality < 10 || quality > 100) {
    return res.status(400).json({ error: 'quality must be a number between 10 and 100' });
  }

  try {
    const { buffer, mime, resizedFrom } = await compressImageIsolated(req.file.buffer, { format, quality });
    await incrementUsage(req.apiUserId);
    res.setHeader('Content-Type', mime);
    if (resizedFrom) res.setHeader('X-Resized-From', `${resizedFrom.width}x${resizedFrom.height}`);
    res.send(buffer);
  } catch (err) {
    console.error('[compress]', err.message);
    res.status(422).json({ error: err.message || 'Could not compress the provided file' });
  }
});

// ── Free-tool fallback ──────────────────────────────────────────────────
// The browser compressor (src/components/Compressor.astro) runs entirely
// client-side, but very large/high-resolution images can exceed what a
// browser tab's canvas can decode. For that case only, it falls back to
// this unauthenticated route instead of the metered /api/v1/compress above,
// so an oversized image doesn't require an account or burn a paid API key's
// quota. Rate-limited per IP since it has no API key/quota gate of its own.
// Uses the same in-memory-only pipeline as the main route — the uploaded
// buffer is never written to disk and is released for GC once the response
// is sent, so there is nothing to clean up afterward.
const fallbackUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: HARD_MAX_UPLOAD_MB * 1024 * 1024 } });
const fallbackRateLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 10 }); // 10 requests / 10 min / IP

compressRouter.post('/api/v1/compress/fallback', fallbackRateLimit, (req, res, next) => {
  fallbackUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `File exceeds the maximum upload size of ${HARD_MAX_UPLOAD_MB} MB` });
    }
    if (err) return next(err);
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Missing file (multipart field "file")' });
  }

  const format = (req.body.format ?? '').toLowerCase();
  if (!SUPPORTED_FORMATS.includes(format)) {
    return res.status(400).json({ error: `format must be one of: ${SUPPORTED_FORMATS.join(', ')}` });
  }

  const quality = req.body.quality ? Number(req.body.quality) : 80;
  if (!Number.isFinite(quality) || quality < 10 || quality > 100) {
    return res.status(400).json({ error: 'quality must be a number between 10 and 100' });
  }

  try {
    const { buffer, mime, resizedFrom } = await compressImageIsolated(req.file.buffer, { format, quality });
    res.setHeader('Content-Type', mime);
    if (resizedFrom) res.setHeader('X-Resized-From', `${resizedFrom.width}x${resizedFrom.height}`);
    res.send(buffer);
  } catch (err) {
    console.error('[compress/fallback]', err.message);
    res.status(422).json({ error: err.message || 'Could not compress the provided file' });
  }
});
