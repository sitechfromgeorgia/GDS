---
name: implementing-background-jobs-queues
description: Implements reliable background job processing, task queues, and scheduled cron jobs using modern 2024-2025 patterns. Includes BullMQ, Inngest, Trigger.dev, Vercel Cron, and serverless solutions. Use when building email queues, webhook delivery with retries, long-running tasks, scheduled reports, or async job processing in Next.js, Node.js, or Python applications.
---

# Implementing Background Jobs & Task Queues

## Quick Start

### For Next.js/Vercel (Serverless-First)
```typescript
// app/api/cron/daily-report.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify Vercel cron signature
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    // Your background task logic
    await generateDailyReport();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

**vercel.json:**
```json
{
  "crons": [{
    "path": "/api/cron/daily-report",
    "schedule": "0 2 * * *"
  }]
}
```

### For Self-Hosted (BullMQ + Redis)
```typescript
// lib/queues/email.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const emailQueue = new Queue('emails', { connection: redis });

// Process emails with retries
const emailWorker = new Worker('emails', async (job) => {
  await sendEmail(job.data);
}, { 
  connection: redis,
  concurrency: 5,
  settings: {
    maxStalledCount: 2,
    stalledInterval: 5000,
    lockDuration: 30000,
    lockRenewTime: 15000
  }
});

// Error handling
emailWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

// Enqueue email
export async function queueEmail(email: string, subject: string, body: string) {
  await emailQueue.add('send', 
    { email, subject, body },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false
    }
  );
}
```

### For Serverless Events (Inngest)
```typescript
// inngest/functions/on-user-signup.ts
import { inngest } from '../client';

export const onUserSignup = inngest.createFunction(
  { id: 'user-signup' },
  { event: 'app/user.signup' },
  async ({ event, step }) => {
    // Step functions automatically retry on failure
    await step.run('send-welcome-email', async () => {
      await sendWelcomeEmail(event.data.email);
    });

    await step.run('create-onboarding-task', async () => {
      await createOnboardingTask(event.data.userId);
    });
  }
);

// Trigger event from your API
import { inngest } from '@/inngest/client';

export async function POST(req: Request) {
  const { email, userId } = await req.json();

  await inngest.send({
    name: 'app/user.signup',
    data: { email, userId }
  });

  return Response.json({ success: true });
}
```

---

## When to Use This Skill

### Use Background Jobs When:
- **Long-running tasks** - Image processing, PDF generation, video transcoding (exceed 30s function timeout)
- **Email sending** - Batch emails with retry logic, handling provider rate limits
- **Webhook delivery** - Third-party notifications with exponential backoff and idempotency
- **Scheduled tasks** - Daily reports, cache warming, database maintenance (cron jobs)
- **Database operations** - Bulk updates, migrations, expensive queries
- **External API calls** - Rate-limited services requiring queued requests
- **Analytics/logging** - Batch processing events without blocking user responses

### Choose Architecture Based On:
- **Vercel/Serverless + Simple** → Vercel Cron + Inngest
- **Vercel/Serverless + Complex** → Trigger.dev or Upstash QStash
- **Self-hosted + High Volume** → BullMQ + Redis
- **Complex Workflows** → Temporal (requires persistent workers)
- **Python Backend** → Celery + Redis

---

## Queue Solutions Comparison

| Solution | Deployment | Setup | Best For |
|----------|-----------|-------|----------|
| **Vercel Cron** | Serverless | Simple | Simple scheduled tasks on Vercel |
| **Inngest** | Serverless | Very Simple | Event-driven background jobs, no infra |
| **Trigger.dev** | Managed | Moderate | Long-running tasks, complex workflows |
| **BullMQ** | Self-hosted | Moderate | High throughput, full control |
| **Upstash QStash** | Serverless | Moderate | HTTP-based serverless queues |
| **Temporal** | Self-hosted/Cloud | Complex | Enterprise workflows, long-running |
| **Celery** | Self-hosted | Complex | Python, distributed systems |

---

## Email Queue with Retry Logic

**Setup:**
```bash
npm install bullmq ioredis @sendgrid/mail
```

**Implementation:**
```typescript
// lib/queues/email-queue.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

export const emailQueue = new Queue('emails', { connection: redis });

interface EmailJob {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

// Process emails with automatic retries
const emailWorker = new Worker(
  'emails',
  async (job) => {
    try {
      await sgMail.send({
        to: job.data.to,
        from: 'noreply@example.com',
        subject: job.data.subject,
        html: job.data.html,
        replyTo: job.data.replyTo
      });

      console.log(`✓ Email sent to ${job.data.to}`);
    } catch (error: any) {
      // Detect permanent errors (don't retry)
      if (error.code === 400 || error.code === 401) {
        throw new Error(`[PERMANENT] ${error.message}`);
      }
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10,
    settings: {
      maxStalledCount: 3,
      stalledInterval: 15000,
      lockDuration: 30000,
      lockRenewTime: 15000
    }
  }
);

emailWorker.on('failed', (job, err) => {
  console.error(`Email job failed: ${job?.id}`, err.message);
});

// Enqueue with exponential backoff
export async function queueEmail(email: EmailJob) {
  await emailQueue.add('send', email, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 3600 }
  });
}
```

**Usage:**
```typescript
// app/api/send-email/route.ts
import { queueEmail } from '@/lib/queues/email-queue';

export async function POST(req: Request) {
  const { email, name } = await req.json();

  await queueEmail({
    to: email,
    subject: `Welcome ${name}!`,
    html: `<h1>Welcome to our platform</h1>`
  });

  return Response.json({ success: true });
}
```

---

## Webhook Delivery with Idempotency

```typescript
// lib/webhook-delivery.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import crypto from 'crypto';

const redis = new Redis(process.env.REDIS_URL);
const webhookQueue = new Queue('webhooks', { connection: redis });

interface WebhookEvent {
  url: string;
  event: string;
  data: any;
  idempotencyKey: string;
}

const webhookWorker = new Worker(
  'webhooks',
  async (job) => {
    const { url, event, data, idempotencyKey } = job.data;

    // Check if already processed (24h window)
    const dedupeKey = `webhook:${idempotencyKey}`;
    const existing = await redis.get(dedupeKey);
    
    if (existing) {
      console.log(`⊘ Webhook duplicate (key: ${idempotencyKey})`);
      return { status: 'deduplicated' };
    }

    // Send webhook with signature
    const signature = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET!)
      .update(JSON.stringify(data))
      .digest('hex');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({ event, data })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    // Mark as processed (expires after 24 hours)
    await redis.setex(dedupeKey, 86400, JSON.stringify({ 
      timestamp: Date.now(),
      jobId: job.id 
    }));

    return { status: 'delivered', url };
  },
  {
    connection: redis,
    concurrency: 20,
    settings: {
      maxStalledCount: 2,
      stalledInterval: 10000,
      lockDuration: 30000
    }
  }
);

webhookWorker.on('failed', (job, err) => {
  console.error(`Webhook delivery failed: ${job?.data.url}`, err.message);
});

export async function deliverWebhook(event: WebhookEvent) {
  await webhookQueue.add('deliver', event, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 604800 }
  });
}
```

---

## Inngest Event-Driven Pattern

**Setup:**
```bash
npm install inngest
```

**Function:**
```typescript
// inngest/functions/on-order-placed.ts
import { inngest } from '../client';

export const onOrderPlaced = inngest.createFunction(
  { 
    id: 'on-order-placed',
    retryPolicy: {
      maxAttempts: 5,
      multiplier: 2,
      initialDelayMs: 1000,
      maxDelayMs: 60000
    }
  },
  { event: 'order/placed' },
  async ({ event, step }) => {
    const { orderId, email, items } = event.data;

    // Step 1: Send confirmation email (independently retried)
    await step.run('send-confirmation-email', async () => {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'orders@example.com',
          to: email,
          subject: `Order #${orderId} confirmed`,
          html: `<h1>Thanks for your order!</h1>`
        })
      });
    });

    // Step 2: Create shipping label
    await step.run('create-shipping-label', async () => {
      await fetch('https://api.shippo.com/shipments', {
        method: 'POST',
        body: JSON.stringify({ orderId, items })
      });
    });

    // Step 3: Wait 3 hours for payment clearance
    await step.sleep('wait-for-payment', '3h');

    // Step 4: Send tracking info
    await step.run('send-tracking-email', async () => {
      const tracking = await getTrackingInfo(orderId);
      // Send email with tracking
    });
  }
);
```

**Expose to Inngest:**
```typescript
// app/api/inngest/route.ts
import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { onOrderPlaced } from '@/inngest/functions/on-order-placed';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [onOrderPlaced]
});
```

**Trigger:**
```typescript
export async function POST(req: Request) {
  const order = await req.json();

  await inngest.send({
    name: 'order/placed',
    data: {
      orderId: order.id,
      email: order.email,
      items: order.items
    }
  });

  return Response.json({ success: true });
}
```

---

## Exponential Backoff Implementation

```typescript
// lib/retry-utils.ts
export async function withExponentialBackoff<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    jitter?: boolean;
  }
): Promise<T> {
  const {
    maxRetries = 5,
    initialDelayMs = 1000,
    maxDelayMs = 60000,
    jitter = true
  } = options || {};

  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry permanent errors
      if (isPermanentError(error)) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        // Calculate delay: baseDelay * 2^attempt
        let delay = initialDelayMs * Math.pow(2, attempt);
        delay = Math.min(delay, maxDelayMs);

        // Add jitter ± 10%
        if (jitter) {
          const jitterRange = delay * 0.1;
          delay += (Math.random() - 0.5) * jitterRange * 2;
        }

        console.log(`Retry attempt ${attempt + 1} after ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, Math.round(delay)));
      }
    }
  }

  throw lastError;
}

function isPermanentError(error: any): boolean {
  // Don't retry 4xx errors except 429 (rate limit) and 408 (timeout)
  if (error.code === 400 || error.code === 401 || error.code === 403 || 
      error.code === 404 || error.code === 422) {
    return true;
  }
  return false;
}
```

---

## Bull Board Dashboard Setup

**Installation:**
```bash
npm install bull-board bull @bull-board/express
```

**Configuration:**
```typescript
// lib/bull-board.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import express from 'express';
import { emailQueue } from './queues/email-queue';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue, {
      allowRetries: true,
      readOnlyMode: false
    })
  ],
  serverAdapter
});

const app = express();

// Protect dashboard
app.use('/admin/queues', (req, res, next) => {
  if (req.headers['x-admin-key'] === process.env.ADMIN_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.use('/admin/queues', serverAdapter.getRouter());
```

**Access:** `http://localhost:3000/admin/queues`

---

## Best Practices

### ✅ DO

1. **Use retries with exponential backoff** - Prevents overwhelming services
2. **Implement idempotency keys** - For webhooks and external APIs
3. **Set appropriate concurrency** - Match downstream rate limits
4. **Monitor queue depth** - Set up alerts for backlog
5. **Batch process when possible** - More efficient than individual jobs
6. **Log job context** - Include user ID, request ID for debugging
7. **Test failure scenarios** - Before production deployment

### ❌ DON'T

1. **Don't process synchronously** - That defeats the purpose of queues
2. **Don't ignore failures** - Monitor dead letter queues
3. **Don't set unlimited retries** - Max 5 retries typically
4. **Don't store secrets in job payloads** - Store in vault, pass IDs
5. **Don't forget to scale workers** - Deploy separately from API

---

## Common Errors & Solutions

**Error: "Job stalled"**
→ Worker crashed or hung. Increase `lockDuration` and monitor worker health.

**Error: "READONLY Redis error"**
→ Redis out of memory. Archive old jobs and set `maxmemory` policy.

**Error: "Timeout waiting for job"**
→ Task too slow. Increase timeout or split into smaller steps.

**Error: "Duplicate emails sent"**
→ No idempotency. Implement dedup key check before processing.

**Error: "Queue backlog grows"**
→ Insufficient workers. Increase concurrency or worker count.

---

## Production Checklist

- [ ] Redis persistence enabled (AOF or RDB)
- [ ] Redis replication configured (HA)
- [ ] Backups scheduled daily
- [ ] Retry attempts set (3-5 recommended)
- [ ] Exponential backoff configured
- [ ] Queue depth alerts enabled
- [ ] Failed job alerts configured
- [ ] Dashboard access secured
- [ ] Dead letter queue implemented
- [ ] Worker health checks in place
- [ ] Load testing completed
- [ ] Redis password/TLS enabled
- [ ] No sensitive data in logs

---

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Inngest Documentation](https://www.inngest.com/docs)
- [Trigger.dev Documentation](https://trigger.dev/docs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Upstash QStash](https://upstash.com/docs/qstash)
- [Temporal Documentation](https://docs.temporal.io/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [Bull Board](https://github.com/felixmosh/bull-board)
