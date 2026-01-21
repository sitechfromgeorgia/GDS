# SKILL.md: Resilient Web Automation

**Skill Name:** `resilient-web-automation`  
**Purpose:** High-availability web data extraction with browser-based rendering, graceful error handling, and ethical compliance.  
**Tech Stack:** Playwright/Puppeteer, Node.js/TypeScript, AWS Lambda/Fargate, BullMQ  
**Maintainer:** Data Engineering Team

---

## 1. Architecture Overview

### 1.1 Core Pattern: Resilient Browser Context Manager

Web automation at scale requires **isolation, recovery, and observability**. This architecture separates concerns:

```
┌─────────────────────────────────────────────┐
│         Task Queue (BullMQ/Redis)           │
│  Manages concurrency, retries, scheduling   │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│    Resilient Browser Context Pool           │
│  • Isolated contexts per session             │
│  • Automatic cleanup on error               │
│  • Health checks & circuit breakers         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│      Request/Response Layer                  │
│  • robots.txt parsing & compliance          │
│  • Exponential backoff + jitter             │
│  • User-Agent rotation (ethical)            │
│  • Timeout + abort mechanisms               │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         Target Domains                       │
│  (e.g., Alta.ge, Zoommer.ge)               │
└─────────────────────────────────────────────┘
```

### 1.2 Browser Selection: Playwright vs Puppeteer

| Aspect | Playwright | Puppeteer |
|--------|-----------|-----------|
| **Multi-browser support** | Chrome/Edge, Firefox, WebKit | Chrome/Chromium only |
| **Stability** | More mature, better error messages | Tightly coupled to Chrome |
| **Performance** | Slightly faster context creation | Faster for pure Chrome tasks |
| **Serverless (Lambda)** | Better due to multi-browser fallback | Requires Chromium-layer optimization |
| **Debugging** | Excellent inspector & trace tools | Good, but less sophisticated |
| **Recommendation** | ✅ **Preferred for resilience** | For Chrome-only, high-throughput scenarios |

**Decision:** Use **Playwright** for production with circuit-breaker fallback to headless HTTP.

---

## 2. Robustness & Error Handling

### 2.1 Exponential Backoff with Jitter

Naive retry strategies (constant delay) cause **thundering herd** problems when multiple workers hit the same timeout window. Exponential backoff + jitter prevents this:

```typescript
// Core retry strategy
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number; // Typically 2
  jitterFactor: number; // Typically 0.1 (10%)
}

function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  // Base exponential delay
  const baseDelay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs
  );

  // Add random jitter: ±10% of baseDelay
  const jitter = baseDelay * config.jitterFactor * (Math.random() - 0.5) * 2;
  
  return Math.max(0, baseDelay + jitter);
}

// Example: Attempt 0 = 100ms, Attempt 1 = ~200ms, Attempt 2 = ~400ms, Attempt 3 = capped at 8000ms
```

**Why jitter matters:**
- Without jitter: All workers retry at T=100ms, T=200ms, T=400ms → synchronized load spikes
- With jitter: Retries spread across 95-105ms, 190-210ms, etc. → natural distribution

### 2.2 HTTP Status Code Handling Strategy

```typescript
interface HttpErrorStrategy {
  statusCode: number;
  isRetryable: boolean;
  isCircuitBreakerTrigger: boolean;
  suggestedDelay?: number;
}

const ERROR_STRATEGIES: Record<number, HttpErrorStrategy> = {
  // 4xx: Client errors (mostly permanent, don't retry)
  400: { statusCode: 400, isRetryable: false, isCircuitBreakerTrigger: false }, // Bad request
  401: { statusCode: 401, isRetryable: false, isCircuitBreakerTrigger: false }, // Unauthorized
  403: { statusCode: 403, isRetryable: false, isCircuitBreakerTrigger: true },  // Forbidden (IP banned?)
  404: { statusCode: 404, isRetryable: false, isCircuitBreakerTrigger: false }, // Not found
  429: { statusCode: 429, isRetryable: true, isCircuitBreakerTrigger: true, suggestedDelay: 60000 }, // Rate limited

  // 5xx: Server errors (transient, retry with backoff)
  500: { statusCode: 500, isRetryable: true, isCircuitBreakerTrigger: false },
  502: { statusCode: 502, isRetryable: true, isCircuitBreakerTrigger: true, suggestedDelay: 5000 }, // Bad gateway
  503: { statusCode: 503, isRetryable: true, isCircuitBreakerTrigger: true, suggestedDelay: 10000 }, // Service unavailable
  504: { statusCode: 504, isRetryable: true, isCircuitBreakerTrigger: true, suggestedDelay: 15000 }, // Gateway timeout
};

// Circuit breaker opens after 5 failures in 2-minute window
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly failureThreshold = 5;
  private readonly windowMs = 2 * 60 * 1000; // 2 minutes
  private readonly cooldownMs = 5 * 60 * 1000; // 5 minutes

  recordFailure(): void {
    const now = Date.now();
    
    // Reset if outside window
    if (now - this.lastFailureTime > this.windowMs) {
      this.failureCount = 0;
    }

    this.failureCount++;
    this.lastFailureTime = now;

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  canAttempt(): boolean {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    // HALF_OPEN: allow one attempt
    return true;
  }

  recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failureCount = 0;
    }
  }
}
```

### 2.3 Timeout Management

Browser timeouts have **multiple layers**:

```typescript
interface TimeoutConfig {
  // Page load: how long to wait for DOMContentLoaded
  navigationTimeoutMs: number;
  // Individual action (click, type, etc.)
  actionTimeoutMs: number;
  // Total operation timeout (across all retries)
  totalTimeoutMs: number;
}

const DEFAULT_TIMEOUTS: TimeoutConfig = {
  navigationTimeoutMs: 15000,  // 15 seconds for page load
  actionTimeoutMs: 5000,       // 5 seconds per interaction
  totalTimeoutMs: 60000,       // 60 seconds total (includes retries)
};

async function navigationWithTimeout(
  page: Page,
  url: string,
  timeoutMs: number,
  signal: AbortSignal
): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    signal.addEventListener('abort', () => clearTimeout(timeoutHandle));

    await Promise.race([
      page.goto(url, { waitUntil: 'domcontentloaded' }),
      new Promise((_, reject) =>
        controller.signal.addEventListener('abort', () =>
          reject(new Error(`Navigation timeout after ${timeoutMs}ms`))
        )
      ),
    ]);

    clearTimeout(timeoutHandle);
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new TimeoutError(`Navigation to ${url} exceeded ${timeoutMs}ms`);
    }
    throw error;
  }
}
```

---

## 3. Browser Context Management

### 3.1 Isolated Context Pattern

Each task should run in an **isolated browser context**, not a shared page:

```typescript
class BrowserContextPool {
  private contexts: BrowserContext[] = [];
  private inUse = new Set<BrowserContext>();
  private readonly browser: Browser;
  private readonly poolSize: number;

  constructor(browser: Browser, poolSize: number = 5) {
    this.browser = browser;
    this.poolSize = poolSize;
  }

  async initialize(): Promise<void> {
    for (let i = 0; i < this.poolSize; i++) {
      const context = await this.browser.newContext({
        // DO NOT include automation detection headers
        // Playwright handles this transparently
        viewport: { width: 1920, height: 1080 },
        // Geolocation for regional targeting (optional)
        geolocation: undefined,
        locale: 'en-US',
        timezoneId: 'America/New_York',
      });

      // Set realistic user agent
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });

      this.contexts.push(context);
    }
  }

  async acquireContext(): Promise<BrowserContext> {
    // Wait for available context (up to 30 seconds)
    const startTime = Date.now();
    while (this.inUse.size >= this.poolSize) {
      if (Date.now() - startTime > 30000) {
        throw new Error('No available context after 30s wait');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const context = this.contexts[this.inUse.size];
    this.inUse.add(context);
    return context;
  }

  releaseContext(context: BrowserContext): void {
    this.inUse.delete(context);
  }

  async cleanupContext(context: BrowserContext): Promise<void> {
    try {
      await context.close();
    } catch (error) {
      console.warn('Error closing context:', error);
    }
  }

  async shutdown(): Promise<void> {
    for (const context of this.contexts) {
      await this.cleanupContext(context);
    }
  }
}
```

### 3.2 Cookie & Header Management (Session Persistence)

For sites requiring login or session affinity:

```typescript
interface SessionStorage {
  cookies: Cookie[];
  headers: Record<string, string>;
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
}

class SessionManager {
  private sessions = new Map<string, SessionStorage>();

  async saveSession(context: BrowserContext, sessionId: string): Promise<void> {
    const cookies = await context.cookies();
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    const page = await context.newPage();
    const localStorage = await page.evaluate(() =>
      Object.fromEntries(Object.entries(window.localStorage))
    );
    await page.close();

    this.sessions.set(sessionId, { cookies, headers, localStorage });
  }

  async restoreSession(context: BrowserContext, sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    await context.addCookies(session.cookies);

    // Restore localStorage via initial script
    if (session.localStorage) {
      const page = await context.newPage();
      await page.evaluate(({ data }) => {
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, value as string);
        });
      }, { data: session.localStorage });
      await page.close();
    }
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
```

---

## 4. Respectful Crawling & Ethical Compliance

### 4.1 Robots.txt Parsing & Compliance

Always parse `robots.txt` **before** making requests:

```typescript
import fetch from 'node-fetch';
import { RobotsParser } from 'robots-parser';

class RobotsCompliance {
  private parsers = new Map<string, any>();
  private fetchCache = new Map<string, { data: string; expireAt: number }>();
  private cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours

  async getRobotsParser(domain: string): Promise<any> {
    // Check cache first
    if (this.parsers.has(domain)) {
      return this.parsers.get(domain);
    }

    const robotsUrl = `https://${domain}/robots.txt`;
    let robotsContent = '';

    try {
      const cached = this.fetchCache.get(robotsUrl);
      if (cached && Date.now() < cached.expireAt) {
        robotsContent = cached.data;
      } else {
        const response = await fetch(robotsUrl, {
          timeout: 5000,
          headers: {
            'User-Agent': 'DataBot/1.0 (+https://yourcompany.com/bot)',
          },
        });

        if (response.ok) {
          robotsContent = await response.text();
          this.fetchCache.set(robotsUrl, {
            data: robotsContent,
            expireAt: Date.now() + this.cacheMaxAge,
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch robots.txt for ${domain}:`, error);
      // Continue with permissive default if robots.txt unavailable
      robotsContent = '';
    }

    const parser = RobotsParser(robotsUrl, robotsContent);
    this.parsers.set(domain, parser);
    return parser;
  }

  async isAllowed(domain: string, path: string, userAgent: string): Promise<boolean> {
    const parser = await this.getRobotsParser(domain);
    return parser.isAllowed(userAgent, path);
  }

  async getCrawlDelay(domain: string, userAgent: string): Promise<number> {
    const parser = await this.getRobotsParser(domain);
    const delay = parser.getCrawlDelay(userAgent) || parser.getCrawlDelay('*');
    
    // Convert seconds to milliseconds, minimum 1 second
    return Math.max(1000, (delay || 1) * 1000);
  }
}

// Usage
const compliance = new RobotsCompliance();
const isAllowed = await compliance.isAllowed('alta.ge', '/products/phones', 'DataBot/1.0');
const crawlDelay = await compliance.getCrawlDelay('alta.ge', 'DataBot/1.0');
console.log(`Allowed: ${isAllowed}, Crawl delay: ${crawlDelay}ms`);
```

### 4.2 Concurrency Control: Per-Domain Rate Limiting

Never send more than `N` requests to a domain simultaneously. Use a **token bucket** pattern:

```typescript
class PerDomainRateLimiter {
  private buckets = new Map<string, TokenBucket>();

  constructor(private requestsPerSecond: number = 1) {}

  private getBucket(domain: string): TokenBucket {
    if (!this.buckets.has(domain)) {
      this.buckets.set(
        domain,
        new TokenBucket(this.requestsPerSecond, 1) // 1 token = 1 request
      );
    }
    return this.buckets.get(domain)!;
  }

  async waitForSlot(domain: string): Promise<void> {
    const bucket = this.getBucket(domain);
    await bucket.consumeToken();
  }
}

class TokenBucket {
  private tokens: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per millisecond
  private lastRefillTime = Date.now();

  constructor(tokensPerSecond: number, capacity: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = tokensPerSecond / 1000;
  }

  async consumeToken(): Promise<void> {
    const now = Date.now();
    const timePassed = now - this.lastRefillTime;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;

    if (this.tokens < 1) {
      // Wait until we have 1 token
      const waitTime = (1 - this.tokens) / this.refillRate;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.tokens -= 1;
    } else {
      this.tokens -= 1;
    }
  }
}
```

### 4.3 User-Agent Rotation (Ethical)

Rotate real, publicly documented user agents. **Do not impersonate** other services:

```typescript
class EthicalUserAgentRotator {
  private agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  ];

  private index = 0;

  getNextAgent(): string {
    const agent = this.agents[this.index];
    this.index = (this.index + 1) % this.agents.length;
    return agent;
  }

  // For transparent bot identification (recommended)
  getBotAgent(): string {
    return 'DataBot/1.0 (+https://yourcompany.com/bot)';
  }
}
```

**Best Practice:** Include a `User-Agent` that identifies your bot AND links to a public policy page explaining your crawling.

---

## 5. Infrastructure Patterns

### 5.1 AWS Lambda: Headless Browser Deployment

Lambda has **strict constraints**: 15-minute timeout, 3GB RAM, ephemeral `/tmp` storage.

```typescript
// serverless.yml
service: resilient-web-automation

provider:
  name: aws
  runtime: nodejs18.x
  memorySize: 3008 # Max memory for better CPU
  timeout: 900 # 15 minutes
  environment:
    REDIS_URL: ${ssm:/resilient-automation/redis-url}
    DOMAIN_WHITELIST: alta.ge,zoommer.ge

layers:
  - arn:aws:lambda:us-east-1:123456789:layer:chromium-arm64:1 # Precompiled Chromium

functions:
  scrapeJob:
    handler: src/handlers/scrapeJob.handler
    ephemeralStorage:
      size: 10240 # 10GB temp storage
    events:
      - sqs:
          arn: arn:aws:sqs:us-east-1:123456789:scrape-queue
          batchSize: 1 # Process one task per invocation
          maximumConcurrency: 10
```

```typescript
// src/handlers/scrapeJob.ts
import { SQSEvent } from 'aws-lambda';
import chromium from 'chrome-aws-lambda';
import { ResilientBrowserClient } from '../lib/browser-client';

export async function handler(event: SQSEvent): Promise<void> {
  let browser: chromium.Browser | null = null;
  const client = new ResilientBrowserClient();

  try {
    // Launch browser with minimal overhead
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
    });

    for (const record of event.Records) {
      const taskData = JSON.parse(record.body);
      const result = await client.executeTask(browser, taskData);
      
      // Store result to S3 or DynamoDB
      await storeResult(result);
    }
  } catch (error) {
    console.error('Handler error:', error);
    // Send to Dead Letter Queue for manual review
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function storeResult(result: any): Promise<void> {
  // Implementation: push to S3, DynamoDB, or message queue
}
```

**Why single invocation per task?** Lambda's container reuse model means concurrent tasks in one invocation share memory, increasing failure blast radius.

### 5.2 ECS Fargate: Long-Running Scrapers

For continuous price monitoring, Fargate is more efficient:

```yaml
# Dockerfile
FROM node:18-bullseye

RUN apt-get update && apt-get install -y \
  wget gnupg ca-certificates fonts-liberation libappindicator3-1 \
  libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 libc6 libcairo2 libcups2 \
  libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

# Install Playwright browsers
RUN npx playwright install --with-deps

WORKDIR /app
COPY . .
RUN npm ci --omit=dev

EXPOSE 8080
CMD ["node", "src/services/crawler-service.js"]
```

```typescript
// src/services/crawler-service.ts
import Queue from 'bull';
import { ResilientBrowserClient } from '../lib/browser-client';

const crawlQueue = new Queue('crawl-jobs', process.env.REDIS_URL);

// Max concurrency prevents resource exhaustion
crawlQueue.process(5, async (job) => {
  const client = new ResilientBrowserClient();
  const result = await client.executeTask(job.data);
  
  // Re-queue if needed (e.g., daily price checks)
  if (job.data.recurring) {
    await crawlQueue.add(job.data, {
      delay: 24 * 60 * 60 * 1000, // 24 hours
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
  
  return result;
});

crawlQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
  // Send alert to monitoring system
});

console.log('Crawler service started, listening for jobs...');
```

### 5.3 BullMQ: Orchestration with Concurrency Limits

```typescript
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Create queue with per-domain throttling
const scrapeQueue = new Queue('scrape-jobs', { connection });

// Prevent thundering herd per domain
const domainConcurrency = new Map<string, number>();
domainConcurrency.set('alta.ge', 1); // 1 concurrent request
domainConcurrency.set('zoommer.ge', 1);

const worker = new Worker(
  'scrape-jobs',
  async (job) => {
    const { domain, url } = job.data;
    const client = new ResilientBrowserClient();
    
    return await client.scrape(url, { domain });
  },
  {
    connection,
    concurrency: 5, // Max 5 jobs in parallel
  }
);

// Monitor queue health
scrapeQueue.on('waiting', (jobId) => {
  console.log(`Job ${jobId} is waiting`);
});

scrapeQueue.on('active', (job) => {
  console.log(`Job ${job.id} is active`);
});

scrapeQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed in ${job.progress()}ms`);
});

scrapeQueue.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

export { scrapeQueue, worker };
```

---

## 6. Code Examples: TypeScript

### 6.1 Complete Resilient Browser Client

```typescript
import { chromium, Page, Browser, BrowserContext } from 'playwright';
import pRetry from 'p-retry';

interface ScrapConfig {
  url: string;
  domain: string;
  selector?: string;
  timeout?: number;
}

export class ResilientBrowserClient {
  private browser: Browser | null = null;
  private contextPool: BrowserContextPool | null = null;
  private rateLimiter: PerDomainRateLimiter;
  private robots: RobotsCompliance;
  private userAgentRotator: EthicalUserAgentRotator;

  constructor() {
    this.rateLimiter = new PerDomainRateLimiter(1); // 1 req/sec per domain
    this.robots = new RobotsCompliance();
    this.userAgentRotator = new EthicalUserAgentRotator();
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-dev-shm-usage', // Reduce memory usage
        '--disable-gpu',
        '--no-first-run',
        '--disable-extensions',
      ],
    });

    this.contextPool = new BrowserContextPool(this.browser, 5);
    await this.contextPool.initialize();
  }

  async scrape(config: ScrapConfig): Promise<string | null> {
    // 1. Check robots.txt compliance
    const allowed = await this.robots.isAllowed(
      config.domain,
      new URL(config.url).pathname,
      this.userAgentRotator.getBotAgent()
    );

    if (!allowed) {
      throw new Error(
        `${config.url} disallowed by robots.txt for bot: ${this.userAgentRotator.getBotAgent()}`
      );
    }

    // 2. Respect crawl delays
    const crawlDelay = await this.robots.getCrawlDelay(
      config.domain,
      this.userAgentRotator.getBotAgent()
    );
    await this.rateLimiter.waitForSlot(config.domain);

    // 3. Execute with retry logic
    return pRetry(
      () => this.scrapeWithContext(config),
      {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 10000,
        onFailedAttempt: (error) => {
          console.warn(
            `Attempt ${error.attemptNumber} failed (${error.retriesLeft} retries left):`,
            error.message
          );
        },
      }
    );
  }

  private async scrapeWithContext(config: ScrapConfig): Promise<string | null> {
    if (!this.contextPool) throw new Error('Context pool not initialized');

    const context = await this.contextPool.acquireContext();
    let page: Page | null = null;

    try {
      page = await context.newPage();

      // Set timeout
      page.setDefaultTimeout(config.timeout || 15000);
      page.setDefaultNavigationTimeout(config.timeout || 15000);

      // Navigate with error handling
      await page.goto(config.url, { waitUntil: 'domcontentloaded' });

      // Wait for selector if provided
      if (config.selector) {
        await page.waitForSelector(config.selector, { timeout: 5000 });
      }

      // Extract content
      const content = await page.content();
      return content;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new TimeoutError(`Page load exceeded timeout for ${config.url}`);
        }
      }
      throw error;
    } finally {
      if (page) await page.close();
      this.contextPool.releaseContext(context);
    }
  }

  async shutdown(): Promise<void> {
    if (this.contextPool) await this.contextPool.shutdown();
    if (this.browser) await this.browser.close();
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}
```

### 6.2 Monitoring & Observability

```typescript
import pino from 'pino';
import StatsD from 'node-statsd';

class MonitoringService {
  private logger = pino({ level: process.env.LOG_LEVEL || 'info' });
  private statsd = new StatsD({
    host: process.env.STATSD_HOST || 'localhost',
    port: parseInt(process.env.STATSD_PORT || '8125'),
    prefix: 'web_automation.',
  });

  logScrapeAttempt(domain: string, url: string, attempt: number): void {
    this.logger.info({ domain, url, attempt }, 'Scrape attempt');
    this.statsd.increment(`scrape.attempts.${domain}`);
  }

  logScrapeSuccess(domain: string, duration: number): void {
    this.logger.info({ domain, duration }, 'Scrape succeeded');
    this.statsd.timing(`scrape.duration.${domain}`, duration);
    this.statsd.increment(`scrape.success.${domain}`);
  }

  logScrapeFailure(
    domain: string,
    error: Error,
    attempt: number
  ): void {
    this.logger.error(
      { domain, error: error.message, attempt },
      'Scrape failed'
    );
    this.statsd.increment(`scrape.failures.${domain}`);
  }

  logCircuitBreakerOpen(domain: string): void {
    this.logger.warn({ domain }, 'Circuit breaker opened');
    this.statsd.gauge(`circuit_breaker.open.${domain}`, 1);
  }
}

export { MonitoringService };
```

---

## 7. Deployment & Testing

### 7.1 Health Checks

```typescript
// src/handlers/health.ts
export async function handler(): Promise<object> {
  const checks = {
    redis: false,
    browser: false,
    robots: false,
    };

  try {
    // Check Redis
    const redis = new Redis(process.env.REDIS_URL);
    await redis.ping();
    checks.redis = true;
    await redis.disconnect();
  } catch (error) {
    console.error('Redis check failed:', error);
  }

  try {
    // Check browser availability (do not launch)
    checks.browser = true; // Assume OK if Lambda can reach this function
  } catch (error) {
    console.error('Browser check failed:', error);
  }

  try {
    // Check robots.txt service
    const compliance = new RobotsCompliance();
    await compliance.getRobotsParser('example.com');
    checks.robots = true;
  } catch (error) {
    console.error('Robots check failed:', error);
  }

  const allHealthy = Object.values(checks).every(Boolean);
  return {
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  };
}
```

### 7.2 Unit Tests

```typescript
// tests/browser-client.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ResilientBrowserClient } from '../src/lib/browser-client';

describe('ResilientBrowserClient', () => {
  let client: ResilientBrowserClient;

  beforeEach(async () => {
    client = new ResilientBrowserClient();
    await client.initialize();
  });

  afterEach(async () => {
    await client.shutdown();
  });

  it('should respect robots.txt', async () => {
    const result = await client.scrape({
      url: 'https://example.com/page',
      domain: 'example.com',
    });

    expect(result).toBeDefined();
  });

  it('should retry on timeout', async () => {
    // Mock a slow endpoint
    const slowUrl = 'https://httpbin.org/delay/2';
    const result = await client.scrape({
      url: slowUrl,
      domain: 'httpbin.org',
      timeout: 10000, // Long enough to succeed
    });

    expect(result).toBeDefined();
  });
});
```

---

## 8. Ethical Guidelines & Disclosure

### ✅ MUST DO
- Parse and respect `robots.txt`
- Limit concurrency to avoid DoS-like behavior
- Identify yourself with a public User-Agent
- Provide a `/robots.txt` endpoint or policy link
- Monitor for 429 (rate limit) responses and back off

### ❌ MUST NOT DO
- Circumvent authentication or access controls
- Harvest personal data without consent
- Impersonate other services or bots
- Scrape against explicit Terms of Service prohibitions
- Use scraped data for unauthorized commercial purposes

### 📋 BEST PRACTICES
1. **Document your scraper** in a public policy
2. **Contact site owners** before large-scale crawling
3. **Implement observability** to detect problems early
4. **Graceful degradation** when rate limited
5. **Regular audits** of scraping patterns and compliance

---

## 9. References

- **Playwright Docs:** https://playwright.dev
- **Puppeteer Docs:** https://pptr.dev
- **RFC 1808 (robots.txt standard):** https://www.ietf.org/rfc/rfc1808.txt
- **AWS Lambda best practices:** https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
- **BullMQ documentation:** https://docs.bullmq.io
- **HTTP Status Codes:** https://httpwg.org/specs/rfc9110.html

---

## 10. Support & Maintenance

**Skill Maintainer:** Data Engineering Team  
**On-Call:** 24/7 alerting via PagerDuty  
**Review Cycle:** Quarterly (check Playwright/Puppeteer updates, HTTP standards, site policy changes)  
**Incident Process:** Log all failures with context (domain, URL, error, retry count), escalate if circuit breaker opens > 5min
