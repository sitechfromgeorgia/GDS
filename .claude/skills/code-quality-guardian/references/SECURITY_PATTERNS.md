# Security Patterns - Comprehensive Guide

## Authentication Patterns

### Password Security

**Hashing Algorithm Requirements**
- ✅ Use bcrypt, argon2, or scrypt
- ✅ Minimum 12 rounds for bcrypt
- ✅ Salt is automatically handled by these libraries
- ❌ NEVER use MD5, SHA1, or plain SHA256 for passwords

```typescript
import bcrypt from 'bcrypt';

// ✅ CORRECT - Hashing password
const SALT_ROUNDS = 12;
async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// ✅ CORRECT - Verifying password
async function verifyPassword(
  plainPassword: string, 
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
```

### Session Management

```typescript
// ✅ Secure session configuration
app.use(session({
  secret: process.env.SESSION_SECRET!, // From environment
  name: 'sessionId', // Don't use default 'connect.sid'
  cookie: {
    httpOnly: true,    // Prevents JavaScript access
    secure: true,      // HTTPS only
    sameSite: 'strict', // CSRF protection
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  },
  resave: false,
  saveUninitialized: false
}));
```

### JWT Best Practices

```typescript
interface JWTPayload {
  userId: string;
  role: string;
  iat: number; // Issued at
  exp: number; // Expiration
}

// ✅ CORRECT - Short-lived tokens
function generateAccessToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' } // Short expiry for access tokens
  );
}

function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.REFRESH_SECRET!,
    { expiresIn: '7d' } // Longer expiry for refresh tokens
  );
}

// ✅ Token verification with proper error handling
function verifyToken(token: string): Result<JWTPayload, string> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return { success: true, data: decoded };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: 'Token expired' };
    }
    return { success: false, error: 'Invalid token' };
  }
}
```

---

## Input Validation & Sanitization

### SQL Injection Prevention

```typescript
// ❌ VULNERABLE - String concatenation
async function getUserByEmail(email: string) {
  const query = `SELECT * FROM users WHERE email = '${email}'`;
  return db.query(query);
  // Attacker can inject: ' OR '1'='1
}

// ✅ SAFE - Parameterized queries
async function getUserByEmail(email: string) {
  const query = 'SELECT * FROM users WHERE email = ?';
  return db.query(query, [email]);
}

// ✅ SAFE - ORM with proper escaping
async function getUserByEmail(email: string) {
  return db.users.findOne({ where: { email } });
}
```

### XSS Prevention

```typescript
import DOMPurify from 'isomorphic-dompurify';

// ✅ Sanitize user HTML content
function sanitizeHTML(dirtyHTML: string): string {
  return DOMPurify.sanitize(dirtyHTML, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
    ALLOWED_ATTR: ['href']
  });
}

// ✅ Escape user text for HTML context
function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

// React automatically escapes - but be careful with dangerouslySetInnerHTML
function UserComment({ comment }: { comment: string }) {
  // ✅ Safe - React escapes by default
  return <div>{comment}</div>;
  
  // ❌ DANGEROUS - Only use with sanitized HTML
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(comment) }} />;
}
```

### Path Traversal Prevention

```typescript
import path from 'path';

// ❌ VULNERABLE
app.get('/download/:filename', (req, res) => {
  const filePath = `./uploads/${req.params.filename}`;
  res.sendFile(filePath);
  // Attacker can use: ../../../../etc/passwd
});

// ✅ SAFE - Validate and normalize path
app.get('/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const uploadsDir = path.resolve('./uploads');
  const filePath = path.join(uploadsDir, filename);
  
  // Ensure path is within uploads directory
  if (!filePath.startsWith(uploadsDir)) {
    return res.status(403).send('Access denied');
  }
  
  res.sendFile(filePath);
});
```

---

## Authorization Patterns

### Role-Based Access Control (RBAC)

```typescript
enum Role {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

interface User {
  id: string;
  role: Role;
}

// ✅ Middleware-based authorization
function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User | undefined;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Usage
app.delete('/users/:id', 
  requireAuth, 
  requireRole(Role.ADMIN), 
  deleteUserHandler
);
```

### Resource-Based Access Control

```typescript
// ✅ Check ownership before allowing operations
async function updatePost(
  postId: string, 
  userId: string, 
  updates: PostUpdate
): Promise<Result<Post, string>> {
  const post = await db.posts.findById(postId);
  
  if (!post) {
    return { success: false, error: 'Post not found' };
  }
  
  // Authorization: Users can only edit their own posts
  if (post.authorId !== userId) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const updatedPost = await db.posts.update(postId, updates);
  return { success: true, data: updatedPost };
}
```

---

## Data Protection

### Environment Variables

```typescript
// ✅ Validate environment variables at startup
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  API_KEY: z.string(),
  PORT: z.coerce.number().default(3000)
});

// Fail fast if environment is invalid
export const env = envSchema.parse(process.env);

// ❌ NEVER commit .env files
// ✅ Use .env.example with dummy values
```

### Encryption at Rest

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

// ✅ Encrypt sensitive data before storing
function encrypt(plaintext: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

// ✅ Decrypt when needed
function decrypt(encrypted: string, iv: string, authTag: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Secure Logging

```typescript
// ❌ NEVER log sensitive data
logger.info('User login', { 
  email: user.email, 
  password: password // NEVER!
});

// ✅ Sanitize logs
interface SanitizedUser {
  id: string;
  email: string;
  // Sensitive fields omitted
}

function sanitizeUser(user: User): SanitizedUser {
  return {
    id: user.id,
    email: user.email
    // password, tokens, etc. not included
  };
}

logger.info('User login', { user: sanitizeUser(user) });
```

---

## API Security

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// ✅ Prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/api/login', authLimiter, loginHandler);

// ✅ General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please slow down'
});

app.use('/api/', apiLimiter);
```

### CORS Configuration

```typescript
import cors from 'cors';

// ❌ DANGEROUS - Allow all origins
app.use(cors({ origin: '*' }));

// ✅ SAFE - Whitelist specific origins
const allowedOrigins = [
  'https://yourdomain.com',
  'https://app.yourdomain.com'
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

### CSRF Protection

```typescript
import csurf from 'csurf';

// ✅ CSRF protection for state-changing operations
const csrfProtection = csurf({ 
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  }
});

// GET endpoint provides token
app.get('/api/form', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// POST endpoint validates token
app.post('/api/form', csrfProtection, (req, res) => {
  // Token automatically validated by middleware
  // Handle form submission
});
```

---

## Dependency Security

### Regular Updates

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

### Minimal Dependencies

```typescript
// ❌ Using large library for simple task
import _ from 'lodash'; // Entire lodash bundle
const result = _.uniq(array);

// ✅ Use native methods when possible
const result = [...new Set(array)];

// ✅ Or use specific module
import uniq from 'lodash/uniq'; // Only uniq function
```

---

## Security Headers

```typescript
import helmet from 'helmet';

// ✅ Essential security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Additional headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

---

## Common Vulnerabilities Checklist

- [ ] **Injection**: All user input is validated and sanitized
- [ ] **Authentication**: Strong password hashing, secure session management
- [ ] **Sensitive Data**: Encryption at rest and in transit
- [ ] **XML External Entities**: XML parsing disabled or sanitized
- [ ] **Broken Access Control**: Authorization checks on all sensitive operations
- [ ] **Security Misconfiguration**: Secure defaults, updated dependencies
- [ ] **XSS**: Output encoding, CSP headers
- [ ] **Insecure Deserialization**: Validate serialized objects
- [ ] **Components with Known Vulnerabilities**: Regular dependency updates
- [ ] **Insufficient Logging**: Security events logged (without sensitive data)

---

## Security Testing

```typescript
// ✅ Test authentication
describe('Authentication', () => {
  it('should reject weak passwords', async () => {
    const result = await createUser({
      email: 'test@example.com',
      password: '123' // Too weak
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('password');
  });
  
  it('should hash passwords before storing', async () => {
    const password = 'SecurePassword123!';
    const user = await createUser({
      email: 'test@example.com',
      password
    });
    
    // Password should be hashed, not stored in plain text
    expect(user.password).not.toBe(password);
    expect(user.password).toHaveLength(60); // bcrypt hash length
  });
});

// ✅ Test authorization
describe('Authorization', () => {
  it('should prevent users from accessing others data', async () => {
    const user1 = await createUser({ email: 'user1@example.com' });
    const user2 = await createUser({ email: 'user2@example.com' });
    
    const result = await updateUser(user2.id, user1.id, { name: 'Hacker' });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });
});
```

---

**Remember**: Security is not a one-time task but an ongoing process. 
Regularly review code for vulnerabilities, keep dependencies updated, 
and stay informed about new security threats.
