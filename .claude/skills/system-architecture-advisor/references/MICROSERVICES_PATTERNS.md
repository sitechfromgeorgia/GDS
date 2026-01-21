# Advanced Microservices Patterns

## Communication Patterns

### Synchronous Communication

**REST/HTTP:**
```
Service A → HTTP Request → Service B
         ← HTTP Response ←
```

**Pros:**
- Simple and well-understood
- Request-response model
- Good for queries

**Cons:**
- Tight coupling
- Cascading failures
- Service availability dependency

**gRPC:**
```
Service A → gRPC Call (Protocol Buffers) → Service B
         ← Structured Response ←
```

**Pros:**
- High performance (binary)
- Strong typing
- Bidirectional streaming
- Built-in load balancing

**Cons:**
- Less human-readable
- Requires code generation
- Browser support limited

### Asynchronous Communication

**Message Queue Pattern:**
```
Producer → Queue → Consumer
         (RabbitMQ)
```

**Event Bus Pattern:**
```
Publisher → Event Bus (Kafka) → Multiple Subscribers
```

**Pros:**
- Loose coupling
- Buffer for traffic spikes
- Retry mechanisms
- Multiple consumers

**Cons:**
- Eventual consistency
- Message ordering challenges
- Duplicate message handling

---

## Resilience Patterns

### Circuit Breaker Pattern

**Purpose:** Prevent cascading failures when downstream service fails.

**States:**
1. **Closed:** Normal operation, requests flow through
2. **Open:** Service failing, reject requests immediately
3. **Half-Open:** Test if service recovered

**Implementation:**
```typescript
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private threshold = 5;
  private timeout = 60000; // 60 seconds

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.openedAt = Date.now();
    }
  }
}
```

### Retry Pattern with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i); // Exponential
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
```

### Bulkhead Pattern

**Purpose:** Isolate resources to prevent total system failure.

**Example:**
```
Service A has:
├─ Thread Pool 1 (Critical operations)
├─ Thread Pool 2 (Background tasks)
└─ Thread Pool 3 (Admin operations)
```

If background tasks consume all resources, critical operations still function.

---

## Service Discovery

### Client-Side Discovery

**Pattern:**
```
Service → Service Registry (Consul/Eureka) → Get service locations
       → Load balance → Call service directly
```

**Pros:**
- No additional hop
- Client controls load balancing

**Cons:**
- Client complexity
- Language-specific logic

### Server-Side Discovery

**Pattern:**
```
Service → Load Balancer → Route to service instance
```

**Pros:**
- Simpler clients
- Centralized routing logic

**Cons:**
- Additional network hop
- Load balancer is bottleneck

---

## Data Management Patterns

### Database per Service

**Pattern:** Each microservice owns its database.

```
User Service → Users DB
Order Service → Orders DB
Product Service → Products DB
```

**Pros:**
- Loose coupling
- Independent scaling
- Technology flexibility

**Cons:**
- Data duplication
- Cross-service queries complex
- Distributed transactions

### Saga Pattern (Distributed Transactions)

**Choreography-Based Saga:**
```
Order Service → OrderCreated event
              → Payment Service → PaymentProcessed event
              → Inventory Service → InventoryReserved event
              → Shipping Service → ShippingScheduled event
```

**If payment fails:**
```
Payment Service → PaymentFailed event
               → Order Service → CancelOrder
               → Inventory Service → ReleaseReservation
```

**Orchestration-Based Saga:**
```
Saga Orchestrator:
1. Create Order
2. Process Payment
   → If fail: Compensate (Cancel Order)
3. Reserve Inventory
   → If fail: Compensate (Refund Payment, Cancel Order)
4. Schedule Shipping
```

**Pros:**
- Eventual consistency
- No distributed locks
- Each service autonomous

**Cons:**
- Complex compensation logic
- Debugging harder
- No ACID guarantees

### CQRS (Command Query Responsibility Segregation)

**Pattern:** Separate read and write models.

```
Commands (Writes)     Queries (Reads)
      ↓                     ↓
  Write Model           Read Model
      ↓                     ↓
  Write DB    →Event→   Read DB
(PostgreSQL)           (ElasticSearch)
```

**When to use:**
- Different scaling needs for reads/writes
- Complex queries needed
- Event sourcing implementation

---

## API Gateway Patterns

### Backend for Frontend (BFF)

**Pattern:** Dedicated API gateway per client type.

```
Web App → Web BFF → Microservices
Mobile App → Mobile BFF → Microservices
Partner API → Partner BFF → Microservices
```

**Benefits:**
- Optimized for each client
- No overfetching
- Different auth requirements
- Version independently

### Aggregation Pattern

**Pattern:** Gateway aggregates multiple service calls.

```
Client → Gateway → [User Service, Order Service, Product Service]
       ← Aggregated Response ←
```

**Benefits:**
- Reduces client requests
- Server-side data composition
- Hides complexity

**Challenges:**
- Partial failures
- Response time = slowest service
- Caching complexity

---

## Monitoring and Observability

### Distributed Tracing

**Pattern:** Track request across services with correlation IDs.

```
Request ID: abc-123

Service A (trace-id: abc-123, span-id: 1) → 50ms
  Service B (trace-id: abc-123, span-id: 2) → 200ms
    Service C (trace-id: abc-123, span-id: 3) → 150ms
  Service D (trace-id: abc-123, span-id: 4) → 30ms

Total: 430ms
```

**Tools:**
- Jaeger
- Zipkin
- AWS X-Ray
- Datadog APM

### Health Checks

**Types:**

1. **Liveness:** Is service alive?
   - HTTP 200 = alive
   - Used by orchestrators (Kubernetes)

2. **Readiness:** Can service handle traffic?
   - Check DB connection
   - Check downstream dependencies
   - Used for load balancing

**Example:**
```typescript
// GET /health/liveness
app.get('/health/liveness', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// GET /health/readiness
app.get('/health/readiness', async (req, res) => {
  try {
    await db.ping();
    await cache.ping();
    res.status(200).json({ 
      status: 'ready',
      checks: { db: 'ok', cache: 'ok' }
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready',
      error: error.message 
    });
  }
});
```

---

## Deployment Patterns

### Blue-Green Deployment

```
Load Balancer
    ↓
    ├─ Blue (Current v1.0) ← 100% traffic
    └─ Green (New v1.1) ← 0% traffic

After testing Green:
    ↓
    ├─ Blue (Old v1.0) ← 0% traffic
    └─ Green (New v1.1) ← 100% traffic
```

**Pros:**
- Instant rollback
- Zero downtime

**Cons:**
- Double infrastructure cost
- Database migrations tricky

### Canary Deployment

```
Load Balancer
    ↓
    ├─ v1.0 ← 95% traffic
    └─ v1.1 ← 5% traffic (canary)

Monitor canary metrics...

If successful:
    ↓
    ├─ v1.0 ← 0%
    └─ v1.1 ← 100%
```

**Pros:**
- Gradual rollout
- Real-world testing
- Lower risk

**Cons:**
- Longer deployment
- Complex traffic management

---

## Anti-Patterns to Avoid

### 1. Distributed Monolith

**Problem:** Microservices that are tightly coupled.

**Signs:**
- Services can't deploy independently
- Shared database across services
- Synchronous communication everywhere
- Change in one service breaks others

**Solution:** Enforce boundaries, async communication, separate databases.

### 2. Chatty Services

**Problem:** Too many inter-service calls for one operation.

**Example:**
```
Client request → 
  Service A → Service B → Service C → Service D → Service E
```

**Solution:** Aggregate, use BFF pattern, cache, or consolidate services.

### 3. God Service

**Problem:** One service does too much.

**Signs:**
- Large codebase in one service
- Too many responsibilities
- Frequent deployments
- Multiple teams working on it

**Solution:** Split into smaller, focused services.

### 4. Nano Services

**Problem:** Services too small, overhead exceeds benefits.

**Signs:**
- Service has single function
- More boilerplate than logic
- High deployment complexity

**Solution:** Merge related services, start with monolith, extract when needed.

---

## Real-World Examples

### Netflix Architecture (Simplified)

```
Edge Service (API Gateway)
    ↓
  Zuul
    ↓
├─ User Service
├─ Content Service
├─ Recommendation Service
├─ Video Encoding Service
└─ Analytics Service

All communicate via:
- REST/HTTP for sync
- Event bus for async
- Circuit breakers everywhere
- Chaos engineering (simulate failures)
```

**Key Lessons:**
- Embrace failure (circuit breakers)
- Eventual consistency
- Extensive monitoring
- Chaos engineering culture

### Uber Architecture Evolution

**Phase 1: Monolith (2012)**
- Single Python/Node.js app
- PostgreSQL database
- Quick MVP

**Phase 2: Service-Oriented (2014)**
- Split into ~100 services
- Geographic routing
- Microservice patterns

**Phase 3: Domain-Oriented (2020+)**
- ~4000 microservices
- Domain-driven design
- Platform teams

**Lessons:**
- Start simple, evolve
- Extract services when needed
- Platform team for infrastructure
- Strong governance required at scale

---

## Decision Framework

**When to choose microservices:**
- ✅ Multiple teams (5+)
- ✅ Different scaling needs
- ✅ Technology diversity needed
- ✅ Strong DevOps culture
- ✅ Mature monitoring

**When to avoid microservices:**
- ❌ Small team (<5 people)
- ❌ Simple domain
- ❌ Limited ops expertise
- ❌ Tight deadlines
- ❌ Cost-sensitive

**Start with modular monolith, extract services as needed.**
