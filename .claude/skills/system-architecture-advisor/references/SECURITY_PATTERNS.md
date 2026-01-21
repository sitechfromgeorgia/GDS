# Security Architecture and Best Practices

## Security-First Architecture Principles

### Defense in Depth

**Principle:** Multiple layers of security controls.

```
Layer 1: Perimeter (Firewall, WAF, DDoS protection)
Layer 2: Network (VPC, Security Groups, Network ACLs)
Layer 3: Application (Authentication, Authorization, Input validation)
Layer 4: Data (Encryption at rest and in transit)
Layer 5: Monitoring (Logging, Intrusion detection, SIEM)
```

**No single point of failure:** If one layer is breached, others remain.

---

## Authentication Patterns

### OAuth 2.0 + OpenID Connect (Recommended)

**Flow: Authorization Code with PKCE**
```
User → Your App → Auth Provider (e.g., Auth0, Supabase)
                       ↓
                  Login Page
                       ↓
                  Authorization Code
                       ↓
     Your App ← Access Token + ID Token
```

**Implementation with Supabase:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password'
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();
```

### JWT (JSON Web Token) Best Practices

**Structure:**
```
Header.Payload.Signature
```

**Payload Example:**
```json
{
  "sub": "user-id-123",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1704067200,
  "exp": 1704153600
}
```

**Security Rules:**
1. **Short Expiration:** 15 minutes for access tokens
2. **Use Refresh Tokens:** Long-lived, can be revoked
3. **Sign with Strong Secret:** HS256 or RS256
4. **Validate on Every Request**
5. **Store Securely:** httpOnly cookies, not localStorage

**Implementation:**
```typescript
import jwt from 'jsonwebtoken';

// Generate token
const accessToken = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

const refreshToken = jwt.sign(
  { userId: user.id },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' }
);

// Verify token
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // Token valid, proceed
} catch (error) {
  // Token invalid or expired
  return res.status(401).json({ error: 'Invalid token' });
}
```

### Multi-Factor Authentication (MFA)

**Common Methods:**
1. **TOTP (Time-based One-Time Password):** Google Authenticator, Authy
2. **SMS:** Less secure but convenient
3. **Email:** Backup method
4. **Hardware Keys:** Most secure (YubiKey, etc.)

**Implementation with Supabase:**
```typescript
// Enable MFA
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
});

// User scans QR code (data.totp.qr_code)

// Verify and activate
await supabase.auth.mfa.verify({
  factorId: data.id,
  code: userEnteredCode
});

// Challenge on login
const { data, error } = await supabase.auth.mfa.challenge({
  factorId: factorId
});

// Verify challenge
await supabase.auth.mfa.verify({
  factorId: factorId,
  challengeId: data.id,
  code: userEnteredCode
});
```

---

## Authorization Patterns

### Role-Based Access Control (RBAC)

**Structure:**
```
User → Role → Permissions

Examples:
- Admin → [read, write, delete, manage_users]
- Editor → [read, write]
- Viewer → [read]
```

**Database Schema:**
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL -- 'admin', 'editor', 'viewer'
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- 'posts:create', 'posts:delete'
  resource VARCHAR(50),
  action VARCHAR(50)
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);
```

**Middleware Implementation:**
```typescript
function requireRole(role: string) {
  return async (req, res, next) => {
    const user = req.user; // From auth middleware
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const hasRole = user.roles.includes(role);
    if (!hasRole) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
}

// Usage
app.delete('/api/posts/:id', requireRole('admin'), deletePost);
```

### Attribute-Based Access Control (ABAC)

**More flexible than RBAC:** Based on attributes (user, resource, environment).

**Example Policy:**
```typescript
{
  "effect": "allow",
  "action": "posts:update",
  "resource": "post",
  "condition": {
    "user.id": "resource.author_id",  // User is author
    "resource.status": "draft"         // Post is draft
  }
}
```

**Implementation:**
```typescript
function canUpdatePost(user: User, post: Post): boolean {
  // User is author AND post is draft
  return user.id === post.author_id && post.status === 'draft';
}

// Or use a policy engine like Casbin, OSO, or Cerbos
```

### Row-Level Security (RLS) with PostgreSQL

**Enable RLS:**
```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own posts
CREATE POLICY user_posts ON posts
  FOR SELECT
  USING (author_id = current_setting('app.current_user_id')::UUID);

-- Policy: Admins can see all posts
CREATE POLICY admin_posts ON posts
  FOR ALL
  USING (
    current_setting('app.current_user_role') = 'admin'
  );
```

**Set context in application:**
```typescript
await db.query(
  "SET LOCAL app.current_user_id = $1",
  [userId]
);

await db.query(
  "SET LOCAL app.current_user_role = $1", 
  [userRole]
);

// Now queries automatically filtered
const posts = await db.query('SELECT * FROM posts');
```

---

## API Security

### Input Validation

**Never Trust User Input:**
```typescript
import { z } from 'zod';

// Define schema
const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  age: z.number().int().min(18).max(120)
});

// Validate
app.post('/api/users', async (req, res) => {
  try {
    const validated = createUserSchema.parse(req.body);
    // Proceed with validated data
  } catch (error) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: error.errors 
    });
  }
});
```

### Rate Limiting

**Prevent Abuse:**
```typescript
import rateLimit from 'express-rate-limit';

// Global rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Max 5 login attempts
  skipSuccessfulRequests: true
});

app.post('/api/login', authLimiter, loginHandler);
```

**Redis-Based Rate Limiting:**
```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

const redis = new Redis();

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  points: 10, // Number of requests
  duration: 1, // Per second
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (error) {
    res.status(429).json({ error: 'Too many requests' });
  }
});
```

### CORS Configuration

```typescript
import cors from 'cors';

// Development: Allow all (NOT for production)
app.use(cors());

// Production: Whitelist specific origins
const allowedOrigins = [
  'https://yourapp.com',
  'https://www.yourapp.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet());

// Or configure individually
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "trusted-cdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "images.example.com"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));
```

**Key Headers:**
- **Strict-Transport-Security:** Force HTTPS
- **Content-Security-Policy:** Prevent XSS
- **X-Frame-Options:** Prevent clickjacking
- **X-Content-Type-Options:** Prevent MIME sniffing

---

## Data Encryption

### Encryption at Rest

**Database-Level Encryption:**
```sql
-- PostgreSQL pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt column
ALTER TABLE users 
ADD COLUMN ssn_encrypted BYTEA;

UPDATE users 
SET ssn_encrypted = pgp_sym_encrypt(ssn, 'encryption-key');

-- Decrypt
SELECT pgp_sym_decrypt(ssn_encrypted, 'encryption-key') AS ssn
FROM users;
```

**Application-Level Encryption:**
```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return: iv + authTag + encrypted
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

function decrypt(encrypted: string): string {
  const iv = Buffer.from(encrypted.slice(0, 32), 'hex');
  const authTag = Buffer.from(encrypted.slice(32, 64), 'hex');
  const ciphertext = encrypted.slice(64);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Encryption in Transit

**Always use TLS/HTTPS:**
```typescript
// Production: Use reverse proxy (nginx, CloudFlare)
// For Node.js direct:
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(443);
```

**Force HTTPS:**
```typescript
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

---

## Password Security

### Hashing (Never Store Plain Text)

```typescript
import bcrypt from 'bcrypt';

// Hash password
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

// Store hashedPassword in database

// Verify password
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Password Requirements

**Enforce Strong Passwords:**
```typescript
function validatePassword(password: string): boolean {
  // Minimum 8 characters
  if (password.length < 8) return false;
  
  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) return false;
  
  // At least one lowercase letter
  if (!/[a-z]/.test(password)) return false;
  
  // At least one number
  if (!/[0-9]/.test(password)) return false;
  
  // At least one special character
  if (!/[!@#$%^&*]/.test(password)) return false;
  
  return true;
}
```

**Password Reset Flow:**
```
1. User requests reset
2. Generate secure token (crypto.randomBytes)
3. Store token hash in DB with expiration (1 hour)
4. Send email with reset link
5. Verify token
6. Allow password change
7. Invalidate token
8. Force logout all sessions
```

---

## SQL Injection Prevention

### Always Use Parameterized Queries

**❌ Vulnerable:**
```typescript
// NEVER DO THIS
const query = `SELECT * FROM users WHERE email = '${userInput}'`;
db.query(query);
```

**✅ Safe:**
```typescript
// Parameterized query (SQL injection safe)
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(query, [userInput]);
```

### ORM Usage

```typescript
// Sequelize (safe)
const user = await User.findOne({
  where: { email: userInput }
});

// Prisma (safe)
const user = await prisma.user.findUnique({
  where: { email: userInput }
});
```

---

## XSS (Cross-Site Scripting) Prevention

### Output Encoding

```typescript
// ❌ Vulnerable
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`<h1>Results for ${query}</h1>`);
});

// ✅ Safe (React automatically escapes)
function SearchResults({ query }) {
  return <h1>Results for {query}</h1>;
}

// ✅ Safe (Manual escaping)
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

### Content Security Policy (CSP)

```typescript
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' trusted-cdn.com; style-src 'self' 'unsafe-inline'"
  );
  next();
});
```

---

## CSRF (Cross-Site Request Forgery) Prevention

### CSRF Tokens

```typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());

const csrfProtection = csrf({ cookie: true });

// Generate token
app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

// Verify token
app.post('/process', csrfProtection, (req, res) => {
  // Token verified automatically
  res.send('Form processed');
});
```

**Frontend (Include in forms):**
```html
<form method="POST" action="/process">
  <input type="hidden" name="_csrf" value="{{ csrfToken }}">
  <!-- Other fields -->
  <button type="submit">Submit</button>
</form>
```

### SameSite Cookies

```typescript
res.cookie('sessionId', sessionToken, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict', // or 'lax'
  maxAge: 3600000 // 1 hour
});
```

---

## Secrets Management

### Environment Variables (Development)

```bash
# .env file (NEVER commit to git)
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=your-secret-key-here
API_KEY=your-api-key
```

```typescript
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
```

### Production Secrets Management

**AWS Secrets Manager:**
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

async function getSecret(secretName: string) {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  return JSON.parse(response.SecretString);
}

const dbCredentials = await getSecret('prod/db-credentials');
```

**HashiCorp Vault:**
```typescript
import vault from 'node-vault';

const client = vault({
  endpoint: 'http://vault:8200',
  token: process.env.VAULT_TOKEN
});

const secret = await client.read('secret/data/db-credentials');
const { username, password } = secret.data.data;
```

---

## Logging and Monitoring

### Secure Logging

**Never Log:**
- Passwords (even hashed)
- API keys
- Tokens
- Credit card numbers
- Personal identifiable information (PII)

**Safe Logging:**
```typescript
// ❌ Bad
logger.info('User login', { email, password });

// ✅ Good
logger.info('User login attempt', { 
  email: email, // OK to log
  userId: user.id,
  ip: req.ip,
  userAgent: req.headers['user-agent']
});

// ❌ Bad
logger.error('Payment failed', { cardNumber: '4111111111111111' });

// ✅ Good
logger.error('Payment failed', { 
  cardLast4: '1111',
  userId: user.id,
  amount: amount
});
```

### Security Event Monitoring

**Events to Log:**
- Failed login attempts
- Successful logins from new locations
- Password resets
- Permission changes
- Unusual API usage
- File uploads
- Admin actions

**SIEM Integration:**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

// Log security event
logger.warn('Failed login attempt', {
  event: 'AUTH_FAILED',
  email: email,
  ip: req.ip,
  attempts: loginAttempts,
  timestamp: new Date().toISOString()
});
```

---

## Security Checklist

### Application Security
- [ ] Use HTTPS everywhere
- [ ] Implement authentication (OAuth 2.0 + OIDC)
- [ ] Add authorization (RBAC or ABAC)
- [ ] Validate all user inputs
- [ ] Use parameterized queries (prevent SQL injection)
- [ ] Sanitize outputs (prevent XSS)
- [ ] Implement CSRF protection
- [ ] Set security headers (Helmet.js)
- [ ] Configure CORS properly
- [ ] Hash passwords with bcrypt (12+ rounds)
- [ ] Implement rate limiting
- [ ] Use secure session management
- [ ] Enable MFA for sensitive accounts

### API Security
- [ ] API authentication (JWT, API keys)
- [ ] Rate limiting per endpoint
- [ ] Input validation (Zod, Joi)
- [ ] API versioning
- [ ] Error handling (don't leak info)
- [ ] Request size limits
- [ ] Timeout configurations

### Data Security
- [ ] Encrypt data at rest
- [ ] Encrypt data in transit (TLS)
- [ ] Secure database connections
- [ ] Row-level security (if applicable)
- [ ] Regular backups
- [ ] Data retention policies
- [ ] PII handling compliance (GDPR, CCPA)

### Infrastructure Security
- [ ] Use VPC/private networks
- [ ] Security groups/firewall rules
- [ ] Principle of least privilege
- [ ] Regular security updates
- [ ] Vulnerability scanning
- [ ] DDoS protection
- [ ] WAF (Web Application Firewall)

### Monitoring & Response
- [ ] Centralized logging
- [ ] Security event monitoring
- [ ] Incident response plan
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Dependency scanning (Snyk, Dependabot)

### Secrets Management
- [ ] Never commit secrets to git
- [ ] Use environment variables (dev)
- [ ] Use secrets manager (prod)
- [ ] Rotate secrets regularly
- [ ] Limit secret access

---

## Common Vulnerabilities (OWASP Top 10)

1. **Broken Access Control**
   - Prevention: Implement proper authorization, deny by default

2. **Cryptographic Failures**
   - Prevention: Use TLS, strong encryption, don't roll your own crypto

3. **Injection**
   - Prevention: Parameterized queries, input validation

4. **Insecure Design**
   - Prevention: Threat modeling, secure design patterns

5. **Security Misconfiguration**
   - Prevention: Secure defaults, regular audits, remove unused features

6. **Vulnerable Components**
   - Prevention: Keep dependencies updated, use tools like Snyk

7. **Authentication Failures**
   - Prevention: MFA, secure password policies, session management

8. **Software and Data Integrity Failures**
   - Prevention: Code signing, SRI for CDN resources

9. **Security Logging Failures**
   - Prevention: Log security events, monitor, alerting

10. **Server-Side Request Forgery (SSRF)**
    - Prevention: Validate URLs, use allowlists, network segmentation

---

## Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP Cheat Sheets: https://cheatsheetseries.owasp.org/
- Auth0 Documentation: https://auth0.com/docs
- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- NIST Cybersecurity Framework
- CIS Controls
