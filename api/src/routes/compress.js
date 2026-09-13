import { Router } from 'express';
import multer from 'multer';
import { requireApiKey, incrementUsage } from '../middleware/requireApiKey.js';
import { compressImage, SUPPORTED_FORMATS } from '../lib/compress.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

export const compressRouter = Router();

compressRouter.post('/api/v1/compress', requireApiKey, upload.single('file'), async (req, res) => {
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
    const { buffer, mime } = await compressImage(req.file.buffer, { format, quality });
    await incrementUsage(req.apiUserId);
    res.setHeader('Content-Type', mime);
    res.send(buffer);
  } catch (err) {
    console.error('[compress]', err.message);
    res.status(422).json({ error: 'Could not compress the provided file', detail: err.message });
  }
});
