# Rate Limiting Strategies

Advanced patterns for handling API rate limits effectively.

## Rate Limiting Concepts

### What is Rate Limiting?
Rate limiting restricts the number of API requests a client can make within a time window to:
- Prevent API abuse
- Ensure fair resource distribution
- Protect server infrastructure
- Maintain service quality

### Common Rate Limit Types

| Type | Description | Example |
|------|-------------|---------|
| **Fixed Window** | Max requests per fixed time period | 100 req/hour |
| **Sliding Window** | Rolling time window | 100 req/last 60 min |
| **Token Bucket** | Tokens refill at fixed rate | 10 tokens/sec, burst 100 |
| **Leaky Bucket** | Requests processed at constant rate | Process 2 req/sec |
| **Concurrent Requests** | Max simultaneous connections | 5 concurrent |

## Rate Limit Headers

### Standard Headers
```
X-RateLimit-Limit: 100          # Total requests allowed
X-RateLimit-Remaining: 75       # Requests remaining
X-RateLimit-Reset: 1699008000   # Unix timestamp when limit resets
Retry-After: 42                 # Seconds to wait before retry
```

### Reading Rate Limit Info
```python
def check_rate_limit(response):
    """Extract rate limit information from response"""
    return {
        'limit': int(response.headers.get('X-RateLimit-Limit', 0)),
        'remaining': int(response.headers.get('X-RateLimit-Remaining', 0)),
        'reset': int(response.headers.get('X-RateLimit-Reset', 0)),
        'reset_time': datetime.fromtimestamp(
            int(response.headers.get('X-RateLimit-Reset', 0))
        )
    }

# Usage
response = requests.get(url)
rate_info = check_rate_limit(response)

if rate_info['remaining'] < 10:
    print(f"Warning: Only {rate_info['remaining']} requests remaining")
    print(f"Limit resets at: {rate_info['reset_time']}")
```

## Client-Side Rate Limiting

### Token Bucket Algorithm
```python
import time
from threading import Lock

class TokenBucket:
    """
    Token bucket rate limiter
    Allows bursts while maintaining average rate
    """
    def __init__(self, capacity, refill_rate):
        """
        Args:
            capacity: Maximum tokens (burst size)
            refill_rate: Tokens added per second
        """
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = capacity
        self.last_refill = time.time()
        self.lock = Lock()
    
    def consume(self, tokens=1):
        """
        Attempt to consume tokens
        Returns True if successful, False if insufficient tokens
        """
        with self.lock:
            self._refill()
            
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            
            return False
    
    def wait_time(self, tokens=1):
        """Calculate time to wait for tokens"""
        with self.lock:
            self._refill()
            
            if self.tokens >= tokens:
                return 0
            
            tokens_needed = tokens - self.tokens
            return tokens_needed / self.refill_rate
    
    def _refill(self):
        """Refill tokens based on elapsed time"""
        now = time.time()
        elapsed = now - self.last_refill
        
        # Add tokens based on elapsed time
        tokens_to_add = elapsed * self.refill_rate
        self.tokens = min(self.capacity, self.tokens + tokens_to_add)
        
        self.last_refill = now

# Usage
bucket = TokenBucket(capacity=100, refill_rate=10)  # 10 tokens/second, burst 100

def make_request():
    if bucket.consume():
        return requests.get(url)
    else:
        wait = bucket.wait_time()
        print(f"Rate limit: waiting {wait:.2f}s")
        time.sleep(wait)
        return make_request()
```

### Sliding Window Counter
```python
from collections import deque
import time

class SlidingWindowRateLimiter:
    """
    Sliding window rate limiter
    More accurate than fixed window
    """
    def __init__(self, max_requests, window_size):
        """
        Args:
            max_requests: Maximum requests allowed
            window_size: Time window in seconds
        """
        self.max_requests = max_requests
        self.window_size = window_size
        self.requests = deque()
        self.lock = Lock()
    
    def allow_request(self):
        """Check if request is allowed"""
        with self.lock:
            now = time.time()
            
            # Remove requests outside window
            while self.requests and self.requests[0] < now - self.window_size:
                self.requests.popleft()
            
            # Check if we can make request
            if len(self.requests) < self.max_requests:
                self.requests.append(now)
                return True
            
            return False
    
    def time_until_allowed(self):
        """Calculate time until next request allowed"""
        with self.lock:
            if len(self.requests) < self.max_requests:
                return 0
            
            oldest = self.requests[0]
            return (oldest + self.window_size) - time.time()

# Usage
limiter = SlidingWindowRateLimiter(max_requests=100, window_size=60)

def make_api_call():
    if limiter.allow_request():
        return requests.get(url)
    else:
        wait = limiter.time_until_allowed()
        print(f"Rate limited: waiting {wait:.2f}s")
        time.sleep(wait)
        return make_api_call()
```

## Handling 429 Responses

### Exponential Backoff with Jitter
```python
import random
import time

class ExponentialBackoff:
    """
    Exponential backoff with jitter
    Prevents thundering herd problem
    """
    def __init__(self, base_delay=1, max_delay=60, jitter=True):
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.jitter = jitter
        self.attempt = 0
    
    def get_delay(self):
        """Calculate backoff delay"""
        # Exponential: base_delay * 2^attempt
        delay = self.base_delay * (2 ** self.attempt)
        
        # Cap at max delay
        delay = min(delay, self.max_delay)
        
        # Add jitter (randomness)
        if self.jitter:
            delay = delay * (0.5 + random.random())
        
        self.attempt += 1
        return delay
    
    def reset(self):
        """Reset attempt counter"""
        self.attempt = 0

def request_with_backoff(url, max_retries=5):
    """Make request with exponential backoff"""
    backoff = ExponentialBackoff(base_delay=1, max_delay=60)
    
    for retry in range(max_retries):
        try:
            response = requests.get(url)
            
            if response.status_code == 429:
                # Rate limited
                delay = get_retry_delay(response, backoff)
                print(f"Rate limited. Waiting {delay:.2f}s (attempt {retry + 1}/{max_retries})")
                time.sleep(delay)
                continue
            
            response.raise_for_status()
            backoff.reset()  # Success, reset counter
            return response
            
        except requests.RequestException as e:
            if retry == max_retries - 1:
                raise
            
            delay = backoff.get_delay()
            print(f"Request failed: {e}. Retrying in {delay:.2f}s")
            time.sleep(delay)
    
    raise MaxRetriesExceeded(f"Failed after {max_retries} attempts")

def get_retry_delay(response, backoff):
    """Get retry delay from Retry-After header or backoff"""
    retry_after = response.headers.get('Retry-After')
    
    if retry_after:
        try:
            # Retry-After can be seconds or HTTP date
            return int(retry_after)
        except ValueError:
            # Parse HTTP date
            retry_time = parse_http_date(retry_after)
            return max(0, (retry_time - datetime.now()).total_seconds())
    
    # No header, use backoff
    return backoff.get_delay()
```

### Adaptive Rate Limiting
```python
class AdaptiveRateLimiter:
    """
    Dynamically adjust rate based on API responses
    """
    def __init__(self, initial_rate=10, min_rate=1, max_rate=100):
        self.current_rate = initial_rate
        self.min_rate = min_rate
        self.max_rate = max_rate
        self.success_count = 0
        self.failure_count = 0
        self.bucket = TokenBucket(capacity=initial_rate, refill_rate=initial_rate)
    
    def on_success(self):
        """Called when request succeeds"""
        self.success_count += 1
        self.failure_count = 0
        
        # Gradually increase rate after sustained success
        if self.success_count >= 10:
            self.increase_rate()
            self.success_count = 0
    
    def on_rate_limit(self):
        """Called when rate limited"""
        self.failure_count += 1
        self.success_count = 0
        
        # Immediately decrease rate
        self.decrease_rate()
    
    def increase_rate(self):
        """Increase request rate"""
        old_rate = self.current_rate
        self.current_rate = min(self.current_rate * 1.2, self.max_rate)
        
        if self.current_rate != old_rate:
            print(f"Increasing rate: {old_rate:.1f} -> {self.current_rate:.1f} req/s")
            self.bucket = TokenBucket(
                capacity=self.current_rate,
                refill_rate=self.current_rate
            )
    
    def decrease_rate(self):
        """Decrease request rate"""
        old_rate = self.current_rate
        self.current_rate = max(self.current_rate * 0.5, self.min_rate)
        
        if self.current_rate != old_rate:
            print(f"Decreasing rate: {old_rate:.1f} -> {self.current_rate:.1f} req/s")
            self.bucket = TokenBucket(
                capacity=self.current_rate,
                refill_rate=self.current_rate
            )
    
    def acquire(self):
        """Acquire token for request"""
        while not self.bucket.consume():
            wait = self.bucket.wait_time()
            time.sleep(wait)

# Usage
limiter = AdaptiveRateLimiter(initial_rate=10)

def make_request_adaptive(url):
    limiter.acquire()
    
    try:
        response = requests.get(url)
        
        if response.status_code == 429:
            limiter.on_rate_limit()
            raise RateLimitError("Rate limited")
        
        response.raise_for_status()
        limiter.on_success()
        
        return response
    except requests.RequestException as e:
        limiter.on_rate_limit()
        raise
```

## Batch Request Strategies

### Batching with Rate Limits
```python
import asyncio

class BatchProcessor:
    """
    Process items in batches respecting rate limits
    """
    def __init__(self, rate_limiter, batch_size=10):
        self.rate_limiter = rate_limiter
        self.batch_size = batch_size
    
    def process_items(self, items, process_func):
        """Process items in rate-limited batches"""
        results = []
        
        for i in range(0, len(items), self.batch_size):
            batch = items[i:i + self.batch_size]
            
            # Wait for rate limit
            if not self.rate_limiter.allow_request():
                wait = self.rate_limiter.time_until_allowed()
                print(f"Rate limit: waiting {wait:.2f}s for next batch")
                time.sleep(wait)
            
            # Process batch
            batch_results = [process_func(item) for item in batch]
            results.extend(batch_results)
            
            print(f"Processed batch {i//self.batch_size + 1}: {len(batch)} items")
        
        return results

# Usage
limiter = SlidingWindowRateLimiter(max_requests=100, window_size=60)
processor = BatchProcessor(limiter, batch_size=10)

def create_user(user_data):
    return requests.post(f"{API_URL}/users", json=user_data)

users = [...]  # List of users to create
results = processor.process_items(users, create_user)
```

### Async Rate Limiting
```python
import asyncio
import aiohttp

class AsyncRateLimiter:
    """
    Async rate limiter for concurrent requests
    """
    def __init__(self, max_requests, window_size):
        self.max_requests = max_requests
        self.window_size = window_size
        self.semaphore = asyncio.Semaphore(max_requests)
        self.requests = []
    
    async def acquire(self):
        """Acquire permission to make request"""
        async with self.semaphore:
            now = asyncio.get_event_loop().time()
            
            # Remove old requests
            self.requests = [r for r in self.requests if r > now - self.window_size]
            
            # Wait if at limit
            while len(self.requests) >= self.max_requests:
                oldest = self.requests[0]
                wait_time = (oldest + self.window_size) - now
                
                if wait_time > 0:
                    await asyncio.sleep(wait_time)
                    now = asyncio.get_event_loop().time()
                
                self.requests = [r for r in self.requests if r > now - self.window_size]
            
            self.requests.append(now)

async def fetch_with_rate_limit(session, url, limiter):
    """Make rate-limited async request"""
    await limiter.acquire()
    
    async with session.get(url) as response:
        return await response.json()

async def fetch_all(urls):
    """Fetch all URLs with rate limiting"""
    limiter = AsyncRateLimiter(max_requests=10, window_size=1)
    
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_with_rate_limit(session, url, limiter) for url in urls]
        results = await asyncio.gather(*tasks)
    
    return results

# Usage
urls = [...]  # List of URLs
results = asyncio.run(fetch_all(urls))
```

## Rate Limit Monitoring

### Track Rate Limit Usage
```python
class RateLimitMonitor:
    """
    Monitor rate limit usage and alert
    """
    def __init__(self, warning_threshold=0.8):
        self.warning_threshold = warning_threshold
        self.metrics = {
            'total_requests': 0,
            'rate_limited': 0,
            'warnings': 0
        }
    
    def record_request(self, response):
        """Record request metrics"""
        self.metrics['total_requests'] += 1
        
        if response.status_code == 429:
            self.metrics['rate_limited'] += 1
            print("⚠️  Rate limit hit!")
        
        # Check remaining capacity
        remaining = response.headers.get('X-RateLimit-Remaining')
        limit = response.headers.get('X-RateLimit-Limit')
        
        if remaining and limit:
            remaining = int(remaining)
            limit = int(limit)
            usage_ratio = 1 - (remaining / limit)
            
            if usage_ratio >= self.warning_threshold:
                self.metrics['warnings'] += 1
                print(f"⚠️  Rate limit warning: {remaining}/{limit} requests remaining ({usage_ratio:.1%} used)")
    
    def get_stats(self):
        """Get rate limit statistics"""
        total = self.metrics['total_requests']
        limited = self.metrics['rate_limited']
        
        return {
            **self.metrics,
            'rate_limit_percentage': (limited / total * 100) if total > 0 else 0
        }

# Usage
monitor = RateLimitMonitor(warning_threshold=0.8)

response = requests.get(url)
monitor.record_request(response)

# Get stats
stats = monitor.get_stats()
print(f"Rate Limited: {stats['rate_limit_percentage']:.2f}% of requests")
```

## Best Practices

### 1. Implement Graceful Degradation
```python
def get_user_data(user_id):
    """Get user data with fallback"""
    try:
        # Try primary API
        return api.get_user(user_id)
    except RateLimitError:
        # Fallback to cache
        cached = cache.get(f'user:{user_id}')
        if cached:
            return cached
        
        # Wait and retry
        time.sleep(calculate_backoff())
        return api.get_user(user_id)
```

### 2. Use Batch Endpoints When Available
```python
# ❌ BAD: Individual requests
for user_id in user_ids:
    user = api.get_user(user_id)  # 100 requests for 100 users

# ✅ GOOD: Batch request
users = api.get_users_batch(user_ids)  # 1 request for 100 users
```

### 3. Cache Aggressively
```python
from functools import lru_cache
from datetime import timedelta

@lru_cache(maxsize=1000)
def get_config(config_key):
    """Cache config values (rarely change)"""
    return api.get_config(config_key)

class TTLCache:
    """Time-based cache"""
    def __init__(self, ttl_seconds=300):
        self.cache = {}
        self.ttl = timedelta(seconds=ttl_seconds)
    
    def get(self, key):
        if key in self.cache:
            value, timestamp = self.cache[key]
            if datetime.now() - timestamp < self.ttl:
                return value
        return None
    
    def set(self, key, value):
        self.cache[key] = (value, datetime.now())
```

### 4. Distribute Load Across Time
```python
import random

def stagger_requests(items, process_func, stagger_seconds=0.1):
    """Add random delay between requests"""
    results = []
    
    for item in items:
        result = process_func(item)
        results.append(result)
        
        # Random delay to distribute load
        time.sleep(random.uniform(0, stagger_seconds))
    
    return results
```

### 5. Monitor and Alert
```python
def setup_rate_limit_alerts():
    """Configure monitoring alerts"""
    alerts = {
        'rate_limit_hit': {
            'threshold': 1,  # Alert on any rate limit
            'window': '5m',
            'severity': 'warning'
        },
        'high_rate_limit_usage': {
            'threshold': 0.8,  # 80% of limit used
            'window': '1m',
            'severity': 'info'
        },
        'sustained_rate_limits': {
            'threshold': 10,  # 10 rate limits in window
            'window': '10m',
            'severity': 'critical'
        }
    }
    return alerts
```

## Resources

- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Leaky Bucket Algorithm](https://en.wikipedia.org/wiki/Leaky_bucket)
- [RFC 6585 - Additional HTTP Status Codes](https://tools.ietf.org/html/rfc6585)
- [HTTP Header Field X-RateLimit](https://tools.ietf.org/id/draft-polli-ratelimit-headers-00.html)
