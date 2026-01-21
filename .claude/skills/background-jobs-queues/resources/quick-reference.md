# Quick Reference: Background Jobs & Task Queues (2024-2025)

## 📊 Solution Decision Matrix

```
START HERE: What's your deployment?
│
├─► Vercel/Serverless
│   ├─ Simple cron (daily/weekly)?        → Use: Vercel Cron ✓ FREE
│   ├─ Event-driven (user signup)?        → Use: Inngest ⭐ EASIEST
│   ├─ Long tasks (>10min)?               → Use: Trigger.dev or QStash
│   └─ HTTP delivery?                     → Use: Upstash QStash
│
└─► Self-Hosted/VPS
    ├─ Email/webhook queue?               → Use: BullMQ + Redis
    ├─ Enterprise workflows?              → Use: Temporal
    └─ Python backend?                    → Use: Celery + Redis
```

---

## 🚀 30-Second Setup

### Vercel Cron (Simplest)
```typescript
// app/api/cron/task.ts
export async function GET(req) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await yourTask();
  return Response.json({ success: true });
}
```

```json
// vercel.json
{ "crons": [{ "path": "/api/cron/task", "schedule": "0 2 * * *" }] }
```

### BullMQ (Most Control)
```bash
npm install bullmq ioredis
```

```typescript
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const queue = new Queue('tasks', { connection: redis });

// Enqueue
await queue.add('process', data, { attempts: 5, backoff: { type: 'exponential', delay: 2000 } });

// Work
new Worker('tasks', async (job) => {
  await processJob(job.data);
}, { connection: redis, concurrency: 10 });
```

### Inngest (Easiest)
```bash
npm install inngest
```

```typescript
export const handler = inngest.createFunction(
  { id: 'process-order' },
  { event: 'order.created' },
  async ({ event, step }) => {
    await step.run('send-email', () => sendEmail(event.data.email));
    await step.sleep('wait', '1h');
    await step.run('send-followup', () => sendFollowup(event.data.email));
  }
);
```

---

## 💡 When to Use Each

| Scenario | Solution | Why |
|----------|----------|-----|
| Daily report generation | Vercel Cron | Simple, zero infrastructure |
| User signup → email | Inngest | Event-driven, no setup |
| Email queue with retries | BullMQ | Full control, monitoring |
| Webhook delivery | BullMQ + idempotency | Duplicate prevention critical |
| Video processing pipeline | Trigger.dev | Long-running, step-based |
| Background analytics | QStash | HTTP-based, serverless |
| Complex workflows (Netflix-style) | Temporal | Durable, enterprise |
| Python async tasks | Celery | Established standard |

---

## ⚙️ Configuration Templates

### Email Queue (Ready to Use)
```typescript
const emailQueue = new Queue('emails', { connection: redis });

const emailWorker = new Worker('emails', 
  async (job) => {
    await sendgrid.send({
      to: job.data.to,
      subject: job.data.subject,
      html: job.data.html
    });
  },
  { connection: redis, concurrency: 10 }
);

// Enqueue
await emailQueue.add('send', 
  { to: user.email, subject: 'Hello', html: '<h1>Hi</h1>' },
  {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 3600 }
  }
);
```

### Webhook Delivery (with Idempotency)
```typescript
// Check for duplicate
const dedupeKey = `webhook:${idempotencyKey}`;
if (await redis.get(dedupeKey)) return { deduplicated: true };

// Send webhook
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(data))
  .digest('hex');

await fetch(url, {
  method: 'POST',
  headers: { 'X-Signature': signature },
  body: JSON.stringify(data)
});

// Mark as processed
await redis.setex(dedupeKey, 86400, Date.now());
```

### Exponential Backoff
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * delay * 0.2;
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
  }
  throw new Error(`Failed after ${maxRetries} attempts`);
}
```

---

## 📊 Monitoring Checklist

- [ ] Queue depth monitored (alert if > threshold)
- [ ] Failed job count tracked
- [ ] Job processing time monitored (p95, p99)
- [ ] Worker health verified (heartbeat, stalled count)
- [ ] Dead letter queue checked regularly
- [ ] Redis memory usage monitored
- [ ] Database connection pool health verified

### Bull Board Quick Setup
```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter
});

app.use('/admin/queues', serverAdapter.getRouter());
// Access: http://localhost:3000/admin/queues
```

---

## 🐛 Common Issues & Fixes

| Error | Fix |
|-------|-----|
| `Job stalled` | Increase `lockDuration` from 30s to 60s+ |
| `READONLY Redis` | Archive old jobs, set `maxmemory-policy` |
| `Timeout` | Increase timeout or split into steps |
| `Duplicates` | Implement idempotency key check |
| `Backlog grows` | Add more workers or increase concurrency |
| `Memory leak` | Ensure `removeOnComplete` is set |
| `Silent failures` | Implement DLQ monitoring and alerts |

---

## 📋 Production Checklist

**Before Going Live:**
- [ ] Redis persistence enabled (AOF)
- [ ] Backups configured (daily)
- [ ] Retry logic tested (intentional failures)
- [ ] Load tested (2x peak volume)
- [ ] Monitoring alerts set up
- [ ] Dashboard access secured
- [ ] Secrets not in job payloads
- [ ] Worker horizontal scaling tested
- [ ] Idempotency implemented (webhooks)
- [ ] Dead letter queue configured
- [ ] Graceful shutdown tested
- [ ] Disaster recovery plan documented

---

## 🔗 Official Docs (Click These)

- [BullMQ](https://docs.bullmq.io/) - Complete reference
- [Inngest](https://www.inngest.com/docs) - Getting started
- [Trigger.dev](https://trigger.dev/docs) - API reference
- [Vercel Cron](https://vercel.com/docs/cron-jobs) - Configuration
- [Upstash QStash](https://upstash.com/docs/qstash) - HTTP queue
- [Temporal](https://docs.temporal.io/) - Workflow engine
- [Celery](https://docs.celeryproject.org/) - Python tasks
- [Bull Board](https://github.com/felixmosh/bull-board) - UI monitoring

---

## 💰 Pricing Summary (2024-2025)

| Solution | Free Tier | Pro Tier | Notes |
|----------|-----------|----------|-------|
| Vercel Cron | ✓ Included | ✓ Included | Free forever |
| Inngest | Free (10k/mo) | $99-999/mo | Great free tier |
| Trigger.dev | Free (10k/mo) | $99-999/mo | Self-host available |
| BullMQ | ✓ Open-source | - | Redis cost only |
| QStash | $0.25/1M | Pay-per-use | Cheap at scale |
| Temporal | ✓ Open-source | $$$$/mo Cloud | Enterprise pricing |
| Celery | ✓ Open-source | - | Redis/RabbitMQ cost |

---

## 🎯 Recommended Stack by Size

### Startup (< 1M/month requests)
**→ Inngest on Vercel**
- No infrastructure
- $0-99/month
- Scales automatically
- Built-in monitoring

### Growing (1M-100M/month)
**→ BullMQ + Redis on Supabase**
- Full control
- Predictable costs
- Advanced monitoring
- Self-hosted option

### Enterprise (>100M/month)
**→ Temporal (self-hosted) + custom infra**
- Durable workflows
- Complex logic
- Custom SLAs
- Full compliance control

---

## 🚀 30-Day Implementation Plan

**Week 1:** Choose solution, set up basics, implement for one feature
**Week 2:** Add monitoring, test failure scenarios, optimize performance
**Week 3:** Load test (2x peak), configure alerts, document runbooks
**Week 4:** Run production checklist, gradual rollout, monitor closely

---

## 📞 Quick Help

**Jobs keep failing?** 
→ Check `isPermanentError()` - retry only transient errors

**Getting duplicates?**
→ Implement idempotency key: `webhook:${orderId}`, TTL 24h

**Queue backing up?**
→ Increase worker concurrency or add more workers

**Memory growing?**
→ Ensure `removeOnComplete` and `removeOnFail` are configured

**Monitoring blind?**
→ Set up Bull Board or use service dashboard (Inngest/Trigger.dev)

---

## 🎓 Learn More

- Exponential backoff prevents overwhelming services
- Idempotency prevents duplicates on retry
- Dead letter queues for failed job inspection
- Monitoring queue depth prevents surprises
- Test failure scenarios before production
- Scale workers independently from API
- Use concurrency to match rate limits

---

**Last Updated:** January 2026  
**Version:** 2024-2025 patterns  
**Status:** Production-ready
