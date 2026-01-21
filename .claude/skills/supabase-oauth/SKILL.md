---
name: supabase-oauth-authentication
description: Implements robust OAuth authentication (Google, GitHub, Discord) in Next.js 15 using Supabase with PKCE flows and account linking. Use when building secure sign-in flows, enabling multi-provider authentication, linking OAuth accounts, or handling identity management in modern full-stack applications.
---

# Supabase OAuth Authentication in Next.js 15

## Quick Start

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2. Create Auth Callback Route

Create `app/auth/callback/route.ts`:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error('Auth exchange failed:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}${next}`)
}
```

### 3. Create Client Component for OAuth Sign-In

```typescript
'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export function OAuthSignIn() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'discord') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback?next=/dashboard`,
      },
    })

    if (error) {
      console.error('OAuth sign-in error:', error)
    }
  }

  return (
    <div className="flex gap-4">
      <button onClick={() => handleOAuthSignIn('google')}>
        Sign in with Google
      </button>
      <button onClick={() => handleOAuthSignIn('github')}>
        Sign in with GitHub
      </button>
      <button onClick={() => handleOAuthSignIn('discord')}>
        Sign in with Discord
      </button>
    </div>
  )
}
```

## When to Use This Skill

- **Initial Setup**: Configuring OAuth providers (Google Cloud Console, GitHub Developer Settings)
- **Authentication Flow**: Implementing PKCE-based sign-in with callback handling
- **Account Management**: Linking multiple OAuth providers to a single user
- **User Dashboard**: Adding "Connect [Provider]" buttons for existing users
- **Error Handling**: Managing `OAuthAccountNotLinked` and provider mismatch errors

## Provider Setup Checklist

### Google OAuth

**Google Cloud Console:**
1. Go to **APIs & Services** → **Credentials**
2. Create OAuth 2.0 Client ID (Application type: Web application)
3. Add Authorized JavaScript Origins:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
4. Add Authorized Redirect URIs:
   - `https://<project-id>.supabase.co/auth/v1/callback` (Supabase callback)
5. Copy Client ID and Client Secret

**Supabase Dashboard:**
1. Go to **Authentication** → **Providers** → **Google**
2. Enable the provider
3. Paste Client ID and Client Secret
4. Save

### GitHub OAuth

**GitHub Developer Settings:**
1. Go to **Settings** → **Developer settings** → **OAuth Apps**
2. Create a new OAuth App
3. Set Authorization callback URL to:
   - `https://<project-id>.supabase.co/auth/v1/callback`
4. Copy Client ID and generate Client Secret
5. Add Redirect URLs to your Next.js app:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

**Supabase Dashboard:**
1. Go to **Authentication** → **Providers** → **GitHub**
2. Enable the provider
3. Paste Client ID and Client Secret
4. Save

### Discord OAuth

**Discord Developer Portal:**
1. Go to **Applications** → Create New Application
2. Go to **OAuth2** → **General**
3. Add Redirect URLs:
   - `https://<project-id>.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret

**Supabase Dashboard:**
1. Go to **Authentication** → **Providers** → **Discord**
2. Enable the provider
3. Paste Client ID and Client Secret
4. Save

### Local Development (localhost)

For local testing with `config.toml`:

```toml
[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = [
  "http://localhost:3000/auth/callback",
  "http://localhost:3000/auth/callback?next=/dashboard"
]

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
redirect_uri = "http://localhost:54321/auth/v1/callback"
```

## Code Examples

### OAuth Sign-In Component with Icons

```typescript
'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface OAuthButtonProps {
  provider: 'google' | 'github' | 'discord'
  label: string
  icon: React.ReactNode
}

function OAuthButton({ provider, label, icon }: OAuthButtonProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${location.origin}/auth/callback?next=/dashboard`,
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error(`${provider} sign-in failed:`, error)
      alert(`Failed to sign in with ${provider}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
    >
      {icon}
      {isLoading ? `Signing in...` : `Sign in with ${label}`}
    </button>
  )
}

export function OAuthSignInButtons() {
  return (
    <div className="flex flex-col gap-3 w-full">
      <OAuthButton
        provider="google"
        label="Google"
        icon={
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fill="currentColor">
              G
            </text>
          </svg>
        }
      />
      <OAuthButton
        provider="github"
        label="GitHub"
        icon={
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        }
      />
      <OAuthButton
        provider="discord"
        label="Discord"
        icon={
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.3671a19.8062 19.8062 0 00-4.8850-1.5152.0742.0742 0 00-.0785.0371c-.211.3671-.444.8467-.607 1.2255a18.2849 18.2849 0 00-5.487 0c-.165-.3889-.399-.8584-.607-1.2255a.077.077 0 00-.0785-.037 19.7513 19.7513 0 00-4.8850 1.5152.0699.0699 0 00-.032.0291C1.002 9.1925.7928 13.9033 1.8617 18.4693a.0792.0792 0 00.031.0472 19.9294 19.9294 0 005.9365 3.0019.0844.0844 0 00.0917-.0292 14.0533 14.0533 0 001.226-1.9925.0841.0841 0 00-.046-.1189 13.0662 13.0662 0 01-1.873-.892.0849.0849 0 01-.008-.1427c.126-.094.252-.192.372-.291a.077.077 0 01.08-.01 18.455 18.455 0 0015.864 0 .077.077 0 01.083.009c.12.099.246.195.372.291a.085.085 0 01-.009.1427 12.9901 12.9901 0 01-1.873.892.084.084 0 00-.046.1189c.264.649.700 1.287 1.226 1.9925a.084.084 0 00.092.0292 19.6948 19.6948 0 005.9365-3.0019.083.083 0 00.031-.0475c1.149-4.400.545-8.2297-.916-11.6062a.0619.0619 0 00-.031-.0291zM8.02 15.3312c-.915 0-1.6697-.8952-1.6697-1.9952s.7392-1.9952 1.6697-1.9952c.9305 0 1.6842.8952 1.6697 1.9952 0 1.0976-.7392 1.9952-1.6697 1.9952zm7.9605 0c-.915 0-1.6697-.8952-1.6697-1.9952s.7392-1.9952 1.6697-1.9952c.9305 0 1.6842.8952 1.6697 1.9952 0 1.0976-.7305 1.9952-1.6697 1.9952z" />
          </svg>
        }
      />
    </div>
  )
}
```

### Account Linking (Authenticated User)

```typescript
'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

interface UserIdentity {
  id: string
  provider: string
  identity_id: string
}

export function AccountLinking() {
  const supabase = createClientComponentClient()
  const [identities, setIdentities] = useState<UserIdentity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchIdentities = async () => {
      const { data, error } = await supabase.auth.getUserIdentities()
      if (error) {
        console.error('Failed to fetch identities:', error)
      } else if (data?.identities) {
        setIdentities(data.identities)
      }
      setIsLoading(false)
    }

    fetchIdentities()
  }, [supabase.auth])

  const handleLinkProvider = async (provider: 'google' | 'github' | 'discord') => {
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${location.origin}/dashboard?provider=${provider}`,
      },
    })

    if (error) {
      console.error(`Failed to link ${provider}:`, error)
      alert(`Failed to connect ${provider}`)
    }
  }

  const handleUnlinkProvider = async (identityId: string, provider: string) => {
    if (identities.length < 2) {
      alert('You must have at least one identity linked')
      return
    }

    const { error } = await supabase.auth.unlinkIdentity({ identity_id: identityId })

    if (error) {
      console.error(`Failed to unlink ${provider}:`, error)
      alert(`Failed to disconnect ${provider}`)
    } else {
      setIdentities(identities.filter(i => i.id !== identityId))
    }
  }

  if (isLoading) return <div>Loading...</div>

  const connectedProviders = identities.map(i => i.provider)
  const availableProviders: Array<'google' | 'github' | 'discord'> = [
    'google',
    'github',
    'discord',
  ].filter(p => !connectedProviders.includes(p))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
        <div className="space-y-2">
          {identities.map(identity => (
            <div
              key={identity.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-md"
            >
              <span className="capitalize font-medium">{identity.provider}</span>
              <button
                onClick={() => handleUnlinkProvider(identity.id, identity.provider)}
                disabled={identities.length === 1}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      </div>

      {availableProviders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Connect More Accounts</h3>
          <div className="space-y-2">
            {availableProviders.map(provider => (
              <button
                key={provider}
                onClick={() => handleLinkProvider(provider)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 capitalize"
              >
                Connect {provider}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

## Best Practices

### 1. PKCE Flow (Automatic with Supabase)
Supabase automatically handles Proof Key for Code Exchange when using `@supabase/auth-helpers-nextjs`. The `exchangeCodeForSession()` method performs the secure code exchange without exposing secrets to the browser.

**Rationale**: PKCE prevents authorization code interception attacks by requiring a dynamically generated code verifier.

### 2. Redirect URL Management
Always use `redirectTo` with `auth/callback` endpoint and include a `next` parameter for post-login navigation:

```typescript
redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(destination)}`
```

**Rationale**: Enables seamless user experience by returning to the intended page after authentication.

### 3. Automatic Account Linking
Supabase automatically links OAuth identities with matching verified email addresses. No manual intervention needed if:
- Both identities have the same email
- The email is verified
- No unconfirmed identities exist

**Rationale**: Reduces friction for users who sign in with multiple providers using the same email.

### 4. Manual Linking for Enhanced UX
Enable manual linking in Supabase dashboard (**Authentication** → **Providers** → **Advanced settings** → **Manual Linking**) to allow authenticated users to connect additional providers.

```typescript
// User must be authenticated
const { error } = await supabase.auth.linkIdentity({
  provider: 'google',
})
```

**Rationale**: Gives users control over their connected accounts and prevents accidental linking.

### 5. Error Boundary for OAuth Failures
Implement error handling in callback route to catch OAuth failures:

```typescript
try {
  await supabase.auth.exchangeCodeForSession(code)
} catch (error) {
  // Log to monitoring service
  console.error('OAuth exchange failed:', error)
  return NextResponse.redirect(`${origin}/auth/error?reason=${error.message}`)
}
```

**Rationale**: Prevents silent failures and improves debugging visibility.

### 6. Minimum 2 Identities for Unlinking
Always check that user has at least 2 linked identities before allowing unlink:

```typescript
const { data } = await supabase.auth.getUserIdentities()
if (data?.identities && data.identities.length < 2) {
  throw new Error('Must keep at least one identity linked')
}
```

**Rationale**: Prevents users from getting locked out of their accounts.

## Common Errors & Solutions

### Error: "OAuthAccountNotLinked"

**Cause**: User tried to sign in with OAuth using an email that matches an existing user account created with a different method (e.g., email/password), but automatic linking is disabled or the email isn't verified.

**Solution**:

1. **For automatic linking**: Ensure email is verified before attempting OAuth:
```typescript
// Send verification email after email/password signup
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepass',
  options: {
    emailRedirectTo: `${location.origin}/auth/callback`,
  },
})
```

2. **For manual linking** (after verification):
```typescript
// User signs in with email/password first, then links OAuth
const { error } = await supabase.auth.linkIdentity({
  provider: 'google',
  options: {
    redirectTo: `${location.origin}/auth/callback`,
  },
})
```

3. **Check manual linking is enabled**:
   - Supabase Dashboard → Authentication → Providers → Advanced → Manual Linking toggle

### Error: "Invalid redirect_uri"

**Cause**: The redirect URL in your OAuth call doesn't match the configured redirect URLs in Supabase or the provider console.

**Solution**:

1. Verify Supabase redirect URLs:
   - Dashboard → Authentication → Providers → [Provider] → Redirect configuration
   - Should include: `https://<project-id>.supabase.co/auth/v1/callback`

2. Verify application callback route:
   - Ensure `redirectTo` matches your deployed domain:
```typescript
redirectTo: `${location.origin}/auth/callback`  // Not hardcoded URLs
```

3. For localhost development:
   - Add to config.toml: `site_url = "http://localhost:3000"`
   - Add to `additional_redirect_urls`: `["http://localhost:3000/auth/callback"]`

### Error: "Provider credentials invalid"

**Cause**: Client ID, Client Secret, or API keys are incorrect or expired.

**Solution**:

1. Regenerate credentials in provider console:
   - Google Cloud Console → APIs & Services → Credentials
   - GitHub Settings → Developer settings → OAuth Apps
   - Discord Developer Portal → Applications

2. Update Supabase Dashboard:
   - Authentication → Providers → [Provider]
   - Paste new credentials
   - Save and wait 2-3 minutes for propagation

3. Verify environment variables (if using CLI):
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
```

### Error: "Unverified email cannot be linked"

**Cause**: Attempting to link an OAuth account with an unverified email address to an existing user.

**Solution**:

```typescript
// Verify email first
const { error } = await supabase.auth.signUp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${location.origin}/auth/callback`,
  },
})

// User verifies email via link in their inbox
// Then can sign in with OAuth using same email
```

### Error: "Session refresh failed"

**Cause**: OAuth token expired or session became invalid during the code exchange.

**Solution**:

```typescript
// In middleware or layout
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createMiddlewareClient({ req: request, res: response })
  
  // Refresh session
  await supabase.auth.getSession()

  return response
}
```

## References

- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Supabase Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking)
- [Supabase PKCE Flow Documentation](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
- [Supabase Sign In with OAuth](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)
- [Supabase Link Identity](https://supabase.com/docs/reference/javascript/auth-linkidentity)
- [Supabase Unlink Identity](https://supabase.com/docs/reference/javascript/auth-unlinkidentity)
- [Google Cloud OAuth 2.0 Setup](https://cloud.google.com/docs/authentication/oauth-2)
- [GitHub OAuth App Documentation](https://docs.github.com/en/apps/oauth-apps)
- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
