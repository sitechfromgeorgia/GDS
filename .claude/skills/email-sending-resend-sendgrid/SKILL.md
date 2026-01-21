---
name: sending-transactional-emails-nextjs
description: Implements production-grade transactional email sending in Next.js 15 using Resend or SendGrid with React Email templates, error handling, and authentication. Use when building welcome emails, password resets, notifications, order confirmations, or any user-triggered transactional messages.
---

# Sending Transactional Emails in Next.js 15

## Quick Start

### 1. Install Dependencies

```bash
npm install resend react-email @react-email/components
```

### 2. Get API Key

- **Resend**: Sign up at [resend.com](https://resend.com), create API key in dashboard
- **SendGrid**: Sign up at [sendgrid.com](https://sendgrid.com), create API key in Settings > API Keys

Add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
# or
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

### 3. Create Email Template

`app/emails/WelcomeEmail.tsx`:
```typescript
import { Button, Container, Head, Hr, Html, Img, Link, Preview, Row, Section, Text } from '@react-email/components';

interface WelcomeEmailProps {
  firstName: string;
  activationLink: string;
}

export function WelcomeEmail({ firstName, activationLink }: WelcomeEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to our platform, {firstName}!</Preview>
      <Container style={containerStyle}>
        <Section style={sectionStyle}>
          <Text style={headingStyle}>Welcome, {firstName}! 👋</Text>
          <Text style={textStyle}>
            We're excited to have you on board. Click the button below to verify your email and get started.
          </Text>
          <Button href={activationLink} style={buttonStyle}>
            Verify Email
          </Button>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            If you didn't create an account, you can safely ignore this email.
          </Text>
        </Section>
      </Container>
    </Html>
  );
}

const containerStyle = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  backgroundColor: '#f9fafb',
  padding: '40px 20px',
};

const sectionStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '40px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const headingStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1f2937',
  marginBottom: '16px',
};

const textStyle = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#4b5563',
  marginBottom: '24px',
};

const buttonStyle = {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
  fontWeight: '600',
};

const hrStyle = {
  borderTop: '1px solid #e5e7eb',
  margin: '24px 0',
};

const footerStyle = {
  fontSize: '12px',
  color: '#9ca3af',
  marginTop: '24px',
};
```

### 4. Send Email via Server Action

`app/actions/send-email.ts`:
```typescript
'use server';

import { Resend } from 'resend';
import { WelcomeEmail } from '@/app/emails/WelcomeEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, firstName: string, activationLink: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'noreply@yourapp.com',
      to: email,
      subject: 'Welcome to Our App! 🎉',
      react: WelcomeEmail({ firstName, activationLink }),
    });

    if (error) {
      console.error('Email send failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Unexpected error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
```

### 5. Use in Form

`app/components/SignupForm.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { sendWelcomeEmail } from '@/app/actions/send-email';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate activation link (implement your own logic)
    const activationLink = `${process.env.NEXT_PUBLIC_APP_URL}/activate?token=xyz`;
    
    const result = await sendWelcomeEmail(email, firstName, activationLink);
    
    if (result.success) {
      alert('Welcome email sent! Check your inbox.');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First name"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

---

## When to Use This Skill

- **User Authentication**: Welcome emails, password resets, email verification
- **Transactions**: Order confirmations, payment receipts, shipping notifications
- **Alerts**: Account warnings, important notifications, activity summaries
- **Automated Workflows**: Scheduled reports, reminder emails, expiration notices
- **User-Triggered**: Contact form submissions, feedback requests, support tickets

**NOT for**: Marketing newsletters, bulk promotional content, campaigns (use dedicated marketing platforms)

---

## Service Comparison (2025)

| Feature | Resend | SendGrid | Postmark | AWS SES |
|---------|--------|----------|----------|---------|
| **Free Tier** | 100 emails/day | 100 emails/day | No | ~62k emails/month |
| **Pricing** | Pay-as-you-go ($0.10/100) | $25/month (5k emails) | $15/month | Variable |
| **Setup Ease** | 🟢 Easiest | 🟡 Moderate | 🟡 Moderate | 🔴 Complex |
| **React Email** | 🟢 Built-in | 🟡 Via manual | 🟡 Via manual | ❌ No |
| **Deliverability** | 🟢 Excellent | 🟢 Excellent | 🟢 Best-in-class | 🟡 Good |
| **Support** | Email | 24/7 (premium) | Email/Chat | Community |
| **Message History** | Forever | 3 days (paid: 30) | 45 days | Not stored |
| **Dedicated IPs** | After warm-up | Extra cost | Auto-managed | Available |

**Recommendation**: **Resend** for startups (simplest with React Email), **Postmark** for scale (best deliverability), **SendGrid** for features (A/B testing, scheduled sends), **AWS SES** for high volume (lowest cost).

---

## Core Concepts

### Email Delivery Workflow

```
User Action (Form Submit)
    ↓
Server Action (TypeScript)
    ↓
React Email Component (Template)
    ↓
ESP API (Resend/SendGrid)
    ↓
SMTP Server
    ↓
Recipients' Mail Server
    ↓
Inbox (if SPF/DKIM/DMARC pass)
```

### React Email Component Structure

```typescript
<Html>           // Root element
  <Head>         // Metadata
  <Preview>      // Preview text in inbox
  <Body>         // Main content wrapper
    <Container>  // Max-width wrapper
      <Section>  // Content sections
        <Text>
        <Button>
        <Link>
      </Section>
    </Container>
  </Body>
</Html>
```

### Authentication Protocols

- **SPF** (Sender Policy Framework): Authorizes which servers can send from your domain
- **DKIM** (DomainKeys Identified Mail): Digitally signs emails to prove authenticity
- **DMARC** (Domain-based Message Authentication): Enforces SPF/DKIM alignment, sets policy for failures

**All three are required for 2025** — Gmail/Outlook will reject unauthenticated bulk senders.

---

## Implementation Guide

### Step 1: Configure Custom Domain (Production)

**For Resend:**

1. Go to Resend Dashboard → Domains
2. Add your domain (e.g., `noreply@yourapp.com`)
3. Copy DNS records provided
4. Add to your domain provider (GoDaddy, Namecheap, Cloudflare, etc.):
   - SPF record
   - DKIM record (CNAME)
   - DMARC record (optional)
5. Wait for verification (5-15 minutes)

**For SendGrid:**

1. Dashboard → Settings → Sender Authentication
2. Add domain for sending
3. Copy SPF and DKIM records
4. Add to DNS provider
5. Verify domain

**DNS Records Example:**

```
SPF:    v=spf1 include:resend.com ~all
DKIM:   resend._domainkey IN CNAME resend.[token].dkim.resend.domains
DMARC:  v=DMARC1; p=none; rua=mailto:your@email.com
```

### Step 2: Build Email Templates

**Pattern: Typed, Reusable Components**

```typescript
// app/emails/index.ts
export { WelcomeEmail } from './WelcomeEmail';
export { PasswordResetEmail } from './PasswordResetEmail';
export { OrderConfirmationEmail } from './OrderConfirmationEmail';

interface EmailTemplateProps {
  [key: string]: string | number | boolean;
}
```

**With Tailwind Styling:**

```typescript
import { Tailwind } from '@react-email/components';

export function StyledEmail({ name }: { name: string }) {
  return (
    <Tailwind config={{ theme: { extend: { colors: { brand: '#2563eb' } } } }}>
      <div className="bg-brand text-white p-8 rounded">
        <h1 className="text-2xl font-bold">Hello {name}</h1>
      </div>
    </Tailwind>
  );
}
```

### Step 3: Error Handling & Retry Logic

```typescript
export async function sendEmailWithRetry(
  emailFn: () => Promise<{ data?: any; error?: any }>,
  maxRetries = 3,
  delayMs = 1000
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await emailFn();
      
      if (result.error) {
        if (attempt === maxRetries) throw new Error(result.error.message);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
        continue;
      }
      
      return { success: true, data: result.data };
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`Email failed after ${maxRetries} attempts:`, error);
        return { success: false, error: String(error) };
      }
    }
  }
}

// Usage
const result = await sendEmailWithRetry(() =>
  resend.emails.send({
    from: 'noreply@yourapp.com',
    to: email,
    subject: 'Test',
    html: '<p>Test</p>',
  })
);
```

### Step 4: Testing with Mailtrap (Development)

```bash
npm install nodemailer
```

`.env.local`:
```
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_user_id
MAILTRAP_PASS=your_access_token
```

`app/actions/send-email-test.ts`:
```typescript
'use server';

import nodemailer from 'nodemailer';
import { render } from '@react-email/components';
import { WelcomeEmail } from '@/app/emails/WelcomeEmail';

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: parseInt(process.env.MAILTRAP_PORT || '2525'),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

export async function sendTestEmail(email: string) {
  try {
    const html = await render(
      WelcomeEmail({
        firstName: 'Test User',
        activationLink: 'https://example.com/activate',
      })
    );

    const result = await transporter.sendMail({
      from: 'test@example.com',
      to: email,
      subject: 'Test Email',
      html,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Test email failed:', error);
    return { success: false, error: String(error) };
  }
}
```

### Step 5: Production Email Queue (Optional)

For high-volume applications, use BullMQ + Redis:

```bash
npm install bullmq redis
```

`lib/email-queue.ts`:
```typescript
import { Queue, Worker } from 'bullmq';
import { Resend } from 'resend';

const emailQueue = new Queue('emails', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Add email to queue
export async function queueEmail(
  to: string,
  template: string,
  data: Record<string, any>
) {
  await emailQueue.add('send', { to, template, data }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
}

// Process queue
new Worker('emails', async (job) => {
  const { to, template, data } = job.data;
  
  const { error } = await resend.emails.send({
    from: 'noreply@yourapp.com',
    to,
    subject: 'Email',
    react: getTemplate(template)(data),
  });

  if (error) throw error;
}, { connection: { host: 'localhost', port: 6379 } });

function getTemplate(name: string) {
  const templates: Record<string, Function> = {
    welcome: (data) => <WelcomeEmail {...data} />,
  };
  return templates[name];
}
```

---

## Complete Code Examples

### Example 1: Password Reset Email

```typescript
// app/emails/PasswordResetEmail.tsx
import { Button, Container, Html, Section, Text } from '@react-email/components';

interface PasswordResetEmailProps {
  userName: string;
  resetLink: string;
  expiresIn: string; // e.g., "2 hours"
}

export function PasswordResetEmail({
  userName,
  resetLink,
  expiresIn,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Container style={{ fontFamily: 'sans-serif', padding: '40px' }}>
        <Section>
          <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
            Reset Your Password
          </Text>
          <Text style={{ color: '#666', marginTop: '16px' }}>
            Hi {userName},
          </Text>
          <Text style={{ color: '#666', lineHeight: '1.6' }}>
            We received a request to reset your password. Click the button below to set a new password.
            This link expires in {expiresIn}.
          </Text>
          <Button
            href={resetLink}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '4px',
              marginTop: '24px',
              textDecoration: 'none',
            }}
          >
            Reset Password
          </Button>
          <Text style={{ color: '#999', fontSize: '12px', marginTop: '32px' }}>
            If you didn't request this, ignore this email. Your password won't change.
          </Text>
        </Section>
      </Container>
    </Html>
  );
}

// app/actions/password-reset.ts
export async function sendPasswordReset(email: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  
  return resend.emails.send({
    from: 'security@yourapp.com',
    to: email,
    subject: 'Reset Your Password',
    react: PasswordResetEmail({
      userName: email.split('@')[0],
      resetLink,
      expiresIn: '2 hours',
    }),
  });
}
```

### Example 2: Order Confirmation

```typescript
// app/emails/OrderConfirmationEmail.tsx
import { Button, Container, Hr, Html, Section, Table, Text } from '@react-email/components';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderConfirmationProps {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  trackingLink: string;
}

export function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  total,
  trackingLink,
}: OrderConfirmationProps) {
  return (
    <Html>
      <Container style={{ fontFamily: 'sans-serif', padding: '40px' }}>
        <Text style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          Order Confirmed ✓
        </Text>
        <Text style={{ color: '#666', marginBottom: '32px' }}>
          Hi {customerName}, thank you for your purchase!
        </Text>

        <Section style={{ marginBottom: '24px' }}>
          <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            Order #{orderNumber}
          </Text>
          <Table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px' }}>{item.name}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Text style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '16px', textAlign: 'right' }}>
            Total: ${total.toFixed(2)}
          </Text>
        </Section>

        <Hr />

        <Button
          href={trackingLink}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '4px',
            marginTop: '24px',
            textDecoration: 'none',
          }}
        >
          Track Order
        </Button>

        <Text style={{ color: '#999', fontSize: '12px', marginTop: '32px' }}>
          Questions? Reply to this email or visit our support center.
        </Text>
      </Container>
    </Html>
  );
}
```

---

## Best Practices

### ✅ DO

- **Use Server Actions** for email: Keeps API keys server-side only
- **Type everything**: Use TypeScript interfaces for template props
- **Test in development**: Use Mailtrap before production
- **Set up SPF/DKIM/DMARC**: Required for delivery to major providers
- **Include unsubscribe link**: Legal requirement for some email types
- **Use custom domains**: Improves deliverability vs. default addresses
- **Implement retry logic**: Network failures are temporary
- **Monitor delivery**: Track bounces and complaints
- **Personalize content**: Use recipient's first name when possible
- **Keep templates focused**: Single action per email (welcome, reset, confirm)

### ❌ DON'T

- **Send from hardcoded addresses**: Use environment variables
- **Embed large images**: Use links instead (keeps email size small)
- **Send sensitive data**: Don't include passwords, tokens, API keys
- **Use generic "From" addresses**: Use branded, recognizable sender names
- **Skip error handling**: Always catch and log failures
- **Send immediately on form submit**: Queue emails for resilience
- **Use only HTML**: Include plain text alternative for email clients
- **Ignore spam filters**: Review HTML/link patterns that trigger filters
- **Batch without limits**: Respect rate limits (typically 100/sec for Resend)

---

## Common Errors & Solutions

### ❌ "Invalid API key" or "Unauthorized"

**Cause**: Missing/incorrect API key in `.env.local`

```bash
# Check key format
# Resend: Should start with "re_"
# SendGrid: Should start with "SG."

# Verify it's loaded
echo $RESEND_API_KEY
```

**Fix**: 
1. Verify key is correct in Resend/SendGrid dashboard
2. Restart dev server after adding env var
3. Check `.env.local` is in `.gitignore`

### ❌ "Email not verified" or "From address rejected"

**Cause**: Sending from unverified domain

**Fix**:
1. For Resend: Use `noreply@resend.dev` during testing
2. For production: Add custom domain in dashboard and verify DNS records
3. Wait 5-15 minutes for DNS propagation
4. Verify SPF record format: `v=spf1 include:sendingservice.com ~all`

### ❌ "React component rendering failed"

**Cause**: Template component not exported or has rendering errors

```typescript
// ❌ Wrong
export default function EmailTemplate() {}

// ✅ Correct
export function EmailTemplate() {}
```

**Fix**:
1. Use named exports, not default exports
2. Test component renders: `npm run build`
3. Check for dynamic imports (not supported)
4. Ensure all props are passed

### ❌ "Emails in spam folder"

**Cause**: Missing SPF/DKIM/DMARC or suspicious content

**Fix** (in order):
1. Add SPF record: `v=spf1 include:resend.com ~all`
2. Add DKIM record from dashboard (CNAME)
3. Add DMARC: `v=DMARC1; p=none; rua=mailto:reports@yourapp.com`
4. Wait 24-48 hours for ISP caching
5. Check email content:
   - Avoid spam trigger words ("FREE", "LIMITED TIME")
   - Use normal font sizes (not huge text)
   - Keep links to minimum
   - Include unsubscribe link
6. Send from verified domain (not @gmail.com)
7. Use Mailtrap spam check before production

### ❌ "Rate limit exceeded" (429)

**Cause**: Sending too many emails too fast

**Fix**:
- Resend: 100 emails/second limit
- SendGrid: Depends on plan (typically 500-3000/minute)

**Solution**:
```typescript
// Add delay between sends
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

for (const email of emails) {
  await sendEmail(email);
  await delay(100); // 100ms between sends
}

// Or use queue system (BullMQ + Redis)
```

### ❌ "Message validation failed" (Tailwind classes not rendered)

**Cause**: React Email Tailwind requires explicit config

```typescript
// ❌ Wrong - Tailwind classes won't inline
<div className="bg-blue-500 p-4">

// ✅ Correct - Wrap with Tailwind component
<Tailwind config={{}}>
  <div className="bg-blue-500 p-4">
</Tailwind>
```

### ❌ "Unsubscribe requirement" (from ISPs)

**Fix**:
```typescript
// Add List-Unsubscribe header
await resend.emails.send({
  from: 'newsletter@yourapp.com',
  to: email,
  subject: 'Monthly Newsletter',
  html: '...',
  headers: {
    'List-Unsubscribe': '<https://yourapp.com/unsubscribe?email={{email}}>',
  },
});
```

---

## Email Template Project Structure

```
app/
├── emails/
│   ├── index.ts                 # Export all templates
│   ├── WelcomeEmail.tsx
│   ├── PasswordResetEmail.tsx
│   ├── OrderConfirmationEmail.tsx
│   └── NotificationEmail.tsx
├── actions/
│   ├── send-email.ts           # Main send logic
│   ├── password-reset.ts        # Specific flows
│   └── order-confirmation.ts
├── api/
│   └── email-webhook.ts         # Delivery status (optional)
└── components/
    └── forms/
        └── SignupForm.tsx       # Usage example

.env.local
  RESEND_API_KEY=re_...
  NEXT_PUBLIC_APP_URL=http://localhost:3000

package.json
  "scripts": {
    "test-email": "node scripts/test-email.js"
  }
```

---

## Advanced: SendGrid Integration

```typescript
// app/actions/send-sendgrid.ts
'use server';

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendWithSendGrid(
  to: string,
  subject: string,
  htmlContent: string
) {
  try {
    const msg = {
      to,
      from: 'noreply@yourapp.com',
      subject,
      html: htmlContent,
      replyTo: 'support@yourapp.com',
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
    };

    const response = await sgMail.send(msg);
    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error) {
    console.error('SendGrid error:', error);
    return { success: false, error: String(error) };
  }
}
```

---

## References

- [Resend Documentation](https://resend.com/docs)
- [React Email Components](https://react.email)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [SPF/DKIM/DMARC Setup Guide](https://easydmarc.com/blog/tools-to-automate-spf-dkim-dmarc-setup/)
- [Email Deliverability Best Practices](https://sendgrid.com/blog/email-deliverability/)
- [Mailtrap Email Testing](https://mailtrap.io)
- [SendGrid Documentation](https://docs.sendgrid.com)
- [Postmark Documentation](https://postmarkapp.com/support)
