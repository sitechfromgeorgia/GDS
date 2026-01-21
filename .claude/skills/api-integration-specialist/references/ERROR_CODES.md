# API Error Codes Reference

Complete reference for HTTP status codes and common API errors.

## HTTP Status Code Groups

### 1xx Informational
- **100 Continue** - Server received request headers, client should send body
- **101 Switching Protocols** - Server switching protocols per Upgrade header

### 2xx Success
- **200 OK** - Request succeeded, response contains data
- **201 Created** - Resource created successfully, Location header provided
- **202 Accepted** - Request accepted for async processing
- **204 No Content** - Success with no response body
- **206 Partial Content** - Partial response for range request

### 3xx Redirection
- **301 Moved Permanently** - Resource permanently moved to new URL
- **302 Found** - Resource temporarily at different URL
- **304 Not Modified** - Resource unchanged, use cached version
- **307 Temporary Redirect** - Temporary redirect, use same method
- **308 Permanent Redirect** - Permanent redirect, use same method

### 4xx Client Errors
- **400 Bad Request** - Malformed request syntax or invalid data
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Authenticated but lacks permission
- **404 Not Found** - Resource doesn't exist
- **405 Method Not Allowed** - HTTP method not supported for endpoint
- **408 Request Timeout** - Client took too long to send request
- **409 Conflict** - Request conflicts with current resource state
- **410 Gone** - Resource permanently deleted
- **411 Length Required** - Content-Length header missing
- **412 Precondition Failed** - Precondition in headers evaluated false
- **413 Payload Too Large** - Request body exceeds size limit
- **414 URI Too Long** - Request URI exceeds server limit
- **415 Unsupported Media Type** - Content-Type not supported
- **422 Unprocessable Entity** - Syntactically correct but semantically invalid
- **429 Too Many Requests** - Rate limit exceeded
- **451 Unavailable For Legal Reasons** - Content blocked by legal requirement

### 5xx Server Errors
- **500 Internal Server Error** - Generic server failure
- **501 Not Implemented** - Server doesn't support functionality
- **502 Bad Gateway** - Invalid response from upstream server
- **503 Service Unavailable** - Server temporarily unable to handle request
- **504 Gateway Timeout** - Upstream server timeout
- **505 HTTP Version Not Supported** - HTTP version not supported

## Common Error Scenarios

### Authentication Errors

#### 401 Unauthorized
**Cause**: Missing, invalid, or expired authentication credentials

**Response Example**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "details": "No valid authentication token provided"
  }
}
```

**Fix**:
- Ensure Authorization header is present
- Check token expiration
- Verify token format (Bearer, API-Key, etc.)
- Re-authenticate if token expired

#### 403 Forbidden
**Cause**: Valid authentication but insufficient permissions

**Response Example**:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions",
    "details": "User lacks 'admin' role required for this operation"
  }
}
```

**Fix**:
- Verify user has required permissions/roles
- Check resource ownership
- Review access control policies
- Contact admin for permission grant

### Validation Errors

#### 400 Bad Request
**Cause**: Invalid request format or data

**Response Example**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "age",
        "message": "Must be a positive integer"
      }
    ]
  }
}
```

**Fix**:
- Validate data before sending
- Check required fields
- Verify data types and formats
- Review API documentation

#### 422 Unprocessable Entity
**Cause**: Correct syntax but semantic errors

**Response Example**:
```json
{
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Cannot process request",
    "details": "User must be at least 18 years old to create account"
  }
}
```

**Fix**:
- Check business rule constraints
- Verify data relationships
- Review domain-specific requirements

### Rate Limiting

#### 429 Too Many Requests
**Cause**: Exceeded API rate limit

**Response Example**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": "Rate limit: 100 requests per minute",
    "retry_after": 42
  }
}
```

**Response Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699008000
Retry-After: 42
```

**Fix**:
- Implement exponential backoff
- Use Retry-After header value
- Add rate limiting to client
- Consider upgrading API plan

### Server Errors

#### 500 Internal Server Error
**Cause**: Unexpected server-side error

**Response Example**:
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "correlation_id": "req-abc-123"
  }
}
```

**Fix**:
- Retry request after delay
- Check API status page
- Contact API support with correlation_id
- Implement circuit breaker pattern

#### 502 Bad Gateway
**Cause**: Gateway received invalid response from upstream

**Fix**:
- Retry request (might be transient)
- Check upstream service status
- Implement retry logic with backoff

#### 503 Service Unavailable
**Cause**: Server temporarily overloaded or under maintenance

**Response Headers**:
```
Retry-After: 120
```

**Fix**:
- Wait for Retry-After duration
- Check API status page
- Implement graceful degradation

#### 504 Gateway Timeout
**Cause**: Gateway timeout waiting for upstream response

**Fix**:
- Increase client timeout
- Check if operation is long-running
- Consider async processing pattern

## Error Response Best Practices

### Standard Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": "Additional context or field-specific errors",
    "correlation_id": "unique-request-id",
    "timestamp": "2025-11-03T10:30:00Z",
    "documentation_url": "https://docs.api.com/errors/ERROR_CODE"
  }
}
```

### Error Code Naming Convention
- Use UPPER_SNAKE_CASE
- Be specific and actionable
- Group by category (AUTH_, VALIDATION_, RATE_LIMIT_, etc.)
- Include severity level when relevant

### Examples of Good Error Codes
```
✅ INVALID_EMAIL_FORMAT
✅ DUPLICATE_EMAIL_ADDRESS
✅ PAYMENT_CARD_DECLINED
✅ INSUFFICIENT_ACCOUNT_BALANCE
✅ RESOURCE_NOT_FOUND
✅ CONCURRENT_MODIFICATION_CONFLICT
```

### Examples of Bad Error Codes
```
❌ ERROR_1001 (meaningless number)
❌ BAD_INPUT (too vague)
❌ FAIL (not descriptive)
❌ exception (not standardized)
```

## Handling Specific Scenarios

### Timeout Handling
```python
from requests.exceptions import Timeout

try:
    response = requests.get(url, timeout=30)
except Timeout:
    # Retry with backoff or fail gracefully
    retry_with_backoff(make_request, max_retries=3)
```

### Connection Errors
```python
from requests.exceptions import ConnectionError

try:
    response = requests.get(url)
except ConnectionError as e:
    # Check network connectivity
    # Verify API endpoint is correct
    # Implement circuit breaker
    log_error("Connection failed", error=e)
```

### SSL/TLS Errors
```python
from requests.exceptions import SSLError

try:
    response = requests.get(url, verify=True)
except SSLError as e:
    # DO NOT disable SSL verification
    # Check certificate validity
    # Update CA certificates
    # Contact API support
    raise SecurityError("SSL verification failed", error=e)
```

## Error Recovery Strategies

### Retry with Exponential Backoff
```python
def exponential_backoff(attempt):
    return min(2 ** attempt + random.uniform(0, 1), 60)

for attempt in range(max_retries):
    try:
        return make_request()
    except RetryableError:
        if attempt < max_retries - 1:
            time.sleep(exponential_backoff(attempt))
        else:
            raise
```

### Circuit Breaker
```python
class CircuitBreaker:
    CLOSED = 'closed'    # Normal operation
    OPEN = 'open'        # Failing, reject requests
    HALF_OPEN = 'half_open'  # Testing recovery
    
    def call(self, func):
        if self.state == 'open':
            if self.should_try_reset():
                self.state = 'half_open'
            else:
                raise CircuitOpenError()
        
        try:
            result = func()
            self.on_success()
            return result
        except Exception:
            self.on_failure()
            raise
```

### Fallback Pattern
```python
def get_user_with_fallback(user_id):
    try:
        # Try primary API
        return api_client.get_user(user_id)
    except APIError:
        try:
            # Try backup API
            return backup_client.get_user(user_id)
        except APIError:
            # Return cached data
            return cache.get(f'user:{user_id}')
```

## Monitoring and Alerting

### Error Metrics to Track
- Error rate by status code
- Error rate by endpoint
- Error rate by client
- Mean time to recovery (MTTR)
- Error trends over time

### Alert Thresholds
```
🔴 Critical:
  - Error rate > 5% for 5 minutes
  - 500 errors > 10 per minute
  - Circuit breaker open

🟡 Warning:
  - Error rate > 2% for 10 minutes
  - 429 rate limit hits increasing
  - Response time degrading
```

## Resources

- [RFC 7231 - HTTP Status Codes](https://tools.ietf.org/html/rfc7231)
- [RFC 7807 - Problem Details for HTTP APIs](https://tools.ietf.org/html/rfc7807)
- [MDN HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
