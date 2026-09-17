import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { authRouter } from './src/routes/auth.js';
import { meRouter } from './src/routes/me.js';
import { keysRouter } from './src/routes/keys.js';
import { plansRouter } from './src/routes/plans.js';
import { billingRouter, billingWebhookHandler } from './src/routes/billing.js';
import { compressRouter } from './src/routes/compress.js';
import { statsRouter } from './src/routes/stats.js';

const PORT = process.env.PORT || 3001;
const ORIGIN = process.env.ALLOWED_ORIGIN || 'https://webpninja.com';

const app = express();
// exposedHeaders: without this, browsers hide every response header from JS
// except a small built-in allowlist — X-Resized-From (compress routes) would
// silently read as null via fetch/XHR otherwise.
app.use(cors({ origin: ORIGIN, exposedHeaders: ['X-Resized-From'] }));

// Registered before express.json(): Razorpay webhook signatures are verified
// against the exact raw request bytes, which json() would otherwise consume.
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), billingWebhookHandler);

app.use(express.json());

app.use(authRouter);
app.use(meRouter);
app.use(keysRouter);
app.use(plansRouter);
app.use(billingRouter);
app.use(compressRouter);
app.use(statsRouter);

app.listen(PORT, () => {
  console.log(`WebP Ninja API listening on port ${PORT}`);
});
