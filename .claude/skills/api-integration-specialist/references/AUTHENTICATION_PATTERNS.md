# Authentication Patterns Reference

Comprehensive guide to implementing API authentication securely.

## Authentication Methods Overview

| Method | Use Case | Security Level | Complexity |
|--------|----------|----------------|------------|
| **OAuth 2.0** | User delegation, third-party access | High | High |
| **JWT Bearer** | Stateless authentication, microservices | High | Medium |
| **API Keys** | Simple service-to-service, public APIs | Medium | Low |
| **Basic Auth** | Legacy systems, internal APIs | Low | Very Low |
| **HMAC** | Webhook verification, high security | High | Medium |

## OAuth 2.0 Implementation

### Grant Types

#### 1. Authorization Code Flow (Web Apps)
**Best for**: Server-side web applications

**Flow**:
```
1. User clicks "Login with Provider"
2. Redirect to authorization server:
   GET /authorize?
     response_type=code&
     client_id=YOUR_CLIENT_ID&
     redirect_uri=YOUR_CALLBACK&
     scope=read:user email&
     state=random_string
   
3. User authenticates and grants permission
4. Redirect back with code:
   GET /callback?code=AUTH_CODE&state=random_string
   
5. Exchange code for tokens:
   POST /token
   Content-Type: application/x-www-form-urlencoded
   
   grant_type=authorization_code&
   code=AUTH_CODE&
   redirect_uri=YOUR_CALLBACK&
   client_id=YOUR_CLIENT_ID&
   client_secret=YOUR_CLIENT_SECRET
   
6. Receive tokens:
   {
     "access_token": "ya29.a0AfH6SMB...",
     "refresh_token": "1//0gV3xYZ...",
     "expires_in": 3600,
     "token_type": "Bearer"
   }
```

**Implementation**:
```python
import requests
from urllib.parse import urlencode

class OAuth2Client:
    def __init__(self, client_id, client_secret, auth_url, token_url, redirect_uri):
        self.client_id = client_id
        self.client_secret = client_secret
        self.auth_url = auth_url
        self.token_url = token_url
        self.redirect_uri = redirect_uri
    
    def get_authorization_url(self, scope, state):
        """Generate authorization URL"""
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': scope,
            'state': state
        }
        return f"{self.auth_url}?{urlencode(params)}"
    
    def exchange_code_for_token(self, code):
        """Exchange authorization code for access token"""
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        response = requests.post(self.token_url, data=data)
        response.raise_for_status()
        
        return response.json()
    
    def refresh_access_token(self, refresh_token):
        """Refresh expired access token"""
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        response = requests.post(self.token_url, data=data)
        response.raise_for_status()
        
        return response.json()
```

#### 2. PKCE Flow (Mobile/SPA)
**Best for**: Mobile apps, single-page applications

**Why PKCE**: Prevents authorization code interception attacks

**Flow**:
```python
import hashlib
import base64
import secrets

def generate_pkce_pair():
    """Generate code verifier and challenge"""
    # Generate random code verifier (43-128 characters)
    code_verifier = base64.urlsafe_b64encode(
        secrets.token_bytes(32)
    ).decode('utf-8').rstrip('=')
    
    # Create code challenge (SHA256 hash of verifier)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).decode('utf-8').rstrip('=')
    
    return code_verifier, code_challenge

# 1. Generate PKCE pair
verifier, challenge = generate_pkce_pair()

# 2. Authorization request with code_challenge
auth_url = f"{base_url}/authorize?" + urlencode({
    'response_type': 'code',
    'client_id': client_id,
    'redirect_uri': redirect_uri,
    'code_challenge': challenge,
    'code_challenge_method': 'S256',
    'scope': 'openid profile email'
})

# 3. Token exchange with code_verifier
token_data = {
    'grant_type': 'authorization_code',
    'code': auth_code,
    'redirect_uri': redirect_uri,
    'client_id': client_id,
    'code_verifier': verifier  # Proves we made the original request
}
```

#### 3. Client Credentials Flow (Server-to-Server)
**Best for**: Backend services, daemon apps

**Flow**:
```python
def get_client_credentials_token(client_id, client_secret, token_url):
    """Get access token using client credentials"""
    data = {
        'grant_type': 'client_credentials',
        'client_id': client_id,
        'client_secret': client_secret,
        'scope': 'api:read api:write'
    }
    
    response = requests.post(token_url, data=data)
    response.raise_for_status()
    
    return response.json()['access_token']
```

### Token Management

#### Secure Token Storage
```python
import keyring

class SecureTokenStore:
    """Store tokens securely using OS keyring"""
    
    def save_token(self, service, username, token):
        """Save token to secure storage"""
        keyring.set_password(service, username, token)
    
    def get_token(self, service, username):
        """Retrieve token from secure storage"""
        return keyring.get_password(service, username)
    
    def delete_token(self, service, username):
        """Remove token from secure storage"""
        keyring.delete_password(service, username)
```

#### Automatic Token Refresh
```python
import time
from threading import Lock

class TokenManager:
    """Manage access tokens with automatic refresh"""
    
    def __init__(self, oauth_client):
        self.oauth_client = oauth_client
        self.access_token = None
        self.refresh_token = None
        self.expires_at = 0
        self.lock = Lock()
    
    def get_valid_token(self):
        """Get valid access token, refreshing if needed"""
        with self.lock:
            # Check if token is expired or about to expire (5 min buffer)
            if time.time() >= self.expires_at - 300:
                self._refresh_token()
            
            return self.access_token
    
    def _refresh_token(self):
        """Refresh access token"""
        if not self.refresh_token:
            raise ValueError("No refresh token available")
        
        token_data = self.oauth_client.refresh_access_token(
            self.refresh_token
        )
        
        self.access_token = token_data['access_token']
        self.expires_at = time.time() + token_data['expires_in']
        
        # Update refresh token if provided
        if 'refresh_token' in token_data:
            self.refresh_token = token_data['refresh_token']
```

## JWT Bearer Tokens

### JWT Structure
```
Header.Payload.Signature

Header (Base64):
{
  "alg": "RS256",
  "typ": "JWT"
}

Payload (Base64):
{
  "sub": "user123",
  "name": "John Doe",
  "iat": 1699000000,
  "exp": 1699003600,
  "iss": "https://auth.example.com",
  "aud": "api.example.com"
}

Signature (RS256):
HMACSHA256(base64(header) + "." + base64(payload), secret)
```

### JWT Validation
```python
import jwt
from datetime import datetime

def validate_jwt(token, public_key, audience, issuer):
    """
    Validate JWT token
    """
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],
            audience=audience,
            issuer=issuer
        )
        
        # Additional validation
        current_time = datetime.utcnow().timestamp()
        
        # Check expiration
        if payload['exp'] < current_time:
            raise jwt.ExpiredSignatureError("Token expired")
        
        # Check not before
        if 'nbf' in payload and payload['nbf'] > current_time:
            raise jwt.InvalidTokenError("Token not yet valid")
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {e}")
```

### Creating JWTs
```python
import jwt
from datetime import datetime, timedelta

def create_jwt(user_id, private_key, expires_in=3600):
    """
    Create signed JWT token
    """
    now = datetime.utcnow()
    
    payload = {
        'sub': str(user_id),
        'iat': now,
        'exp': now + timedelta(seconds=expires_in),
        'iss': 'https://auth.example.com',
        'aud': 'api.example.com'
    }
    
    token = jwt.encode(
        payload,
        private_key,
        algorithm='RS256'
    )
    
    return token
```

## API Keys

### Implementation Patterns

#### Header-Based (Recommended)
```python
import requests

def call_api_with_key(url, api_key):
    """Use API key in header"""
    headers = {
        'X-API-Key': api_key,
        'Content-Type': 'application/json'
    }
    
    response = requests.get(url, headers=headers)
    return response.json()
```

#### Query Parameter (Less Secure)
```python
# ⚠️  Only use for public, read-only endpoints
def call_api_with_query_key(url, api_key):
    """Use API key in query parameter"""
    params = {'api_key': api_key}
    response = requests.get(url, params=params)
    return response.json()
```

### API Key Best Practices
```python
import os
import secrets

class APIKeyManager:
    """Manage API keys securely"""
    
    @staticmethod
    def generate_key(length=32):
        """Generate cryptographically secure API key"""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def load_from_env(key_name):
        """Load API key from environment"""
        api_key = os.getenv(key_name)
        
        if not api_key:
            raise ValueError(f"API key '{key_name}' not found in environment")
        
        return api_key
    
    @staticmethod
    def rotate_key(old_key, grace_period_days=7):
        """
        Rotate API key with grace period
        Returns new key and expiration time for old key
        """
        new_key = APIKeyManager.generate_key()
        old_key_expires = datetime.now() + timedelta(days=grace_period_days)
        
        return {
            'new_key': new_key,
            'old_key_expires': old_key_expires
        }
```

## HMAC Signature Authentication

### Use Cases
- Webhook verification
- High-security API calls
- Request tampering prevention

### Implementation
```python
import hmac
import hashlib
import time

class HMACAuth:
    """HMAC-based request signing"""
    
    def __init__(self, api_key, secret_key):
        self.api_key = api_key
        self.secret_key = secret_key
    
    def sign_request(self, method, url, body):
        """
        Generate HMAC signature for request
        """
        timestamp = str(int(time.time()))
        
        # Create string to sign: METHOD + URL + TIMESTAMP + BODY
        string_to_sign = f"{method}{url}{timestamp}{body}"
        
        # Generate HMAC signature
        signature = hmac.new(
            self.secret_key.encode(),
            string_to_sign.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return {
            'X-API-Key': self.api_key,
            'X-Timestamp': timestamp,
            'X-Signature': signature
        }
    
    def verify_signature(self, signature, method, url, body, timestamp):
        """
        Verify HMAC signature
        """
        # Check timestamp freshness (5 minute window)
        current_time = int(time.time())
        request_time = int(timestamp)
        
        if abs(current_time - request_time) > 300:
            raise ValueError("Request timestamp too old")
        
        # Recreate signature
        string_to_sign = f"{method}{url}{timestamp}{body}"
        expected_signature = hmac.new(
            self.secret_key.encode(),
            string_to_sign.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures (timing-safe)
        if not hmac.compare_digest(signature, expected_signature):
            raise ValueError("Invalid signature")
        
        return True
```

## Multi-Factor Authentication (MFA)

### TOTP Implementation
```python
import pyotp
import qrcode

class TOTPManager:
    """Time-based One-Time Password manager"""
    
    @staticmethod
    def generate_secret():
        """Generate TOTP secret"""
        return pyotp.random_base32()
    
    @staticmethod
    def get_totp_uri(secret, username, issuer):
        """Generate TOTP URI for QR code"""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=username,
            issuer_name=issuer
        )
    
    @staticmethod
    def generate_qr_code(uri, filename):
        """Generate QR code for TOTP setup"""
        qr = qrcode.make(uri)
        qr.save(filename)
    
    @staticmethod
    def verify_code(secret, code):
        """Verify TOTP code"""
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=1)
```

## Security Best Practices

### 1. Never Hardcode Credentials
```python
# ❌ WRONG
API_KEY = "sk-1234567890"

# ✅ CORRECT
import os
API_KEY = os.getenv('API_KEY')

if not API_KEY:
    raise ValueError("API_KEY environment variable not set")
```

### 2. Use Environment Variables
```bash
# .env file (never commit to git)
API_KEY=your_api_key_here
API_SECRET=your_secret_here
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
```

```python
from dotenv import load_dotenv

load_dotenv()  # Load .env file

API_KEY = os.getenv('API_KEY')
```

### 3. Implement Token Rotation
```python
def rotate_tokens_periodically():
    """Rotate tokens every 90 days"""
    TOKEN_LIFETIME_DAYS = 90
    
    if days_since_last_rotation() >= TOKEN_LIFETIME_DAYS:
        old_token = current_token
        new_token = generate_new_token()
        
        # Gradual rollover
        activate_token(new_token)
        schedule_deactivation(old_token, days=7)
```

### 4. Use HTTPS Only
```python
import requests

# ✅ CORRECT - Always use HTTPS
response = requests.get('https://api.example.com/data')

# ❌ WRONG - Never use HTTP for authentication
response = requests.get('http://api.example.com/data')
```

### 5. Implement Rate Limiting
```python
from functools import wraps
import time

def rate_limit(max_calls, period):
    """Decorator to rate limit function calls"""
    calls = []
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            now = time.time()
            
            # Remove old calls
            calls[:] = [c for c in calls if c > now - period]
            
            if len(calls) >= max_calls:
                raise RateLimitError(
                    f"Rate limit exceeded: {max_calls} calls per {period}s"
                )
            
            calls.append(now)
            return func(*args, **kwargs)
        
        return wrapper
    return decorator

@rate_limit(max_calls=100, period=60)
def call_api(endpoint):
    """Rate-limited API call"""
    return requests.get(endpoint)
```

## Testing Authentication

### Mock OAuth Flow
```python
import pytest
from unittest.mock import Mock, patch

def test_oauth_flow():
    """Test OAuth authorization flow"""
    oauth_client = OAuth2Client(
        client_id='test_client',
        client_secret='test_secret',
        auth_url='https://auth.example.com/authorize',
        token_url='https://auth.example.com/token',
        redirect_uri='http://localhost/callback'
    )
    
    # Test authorization URL generation
    auth_url = oauth_client.get_authorization_url(
        scope='read:user email',
        state='random_state'
    )
    
    assert 'client_id=test_client' in auth_url
    assert 'scope=read:user+email' in auth_url
    
    # Mock token exchange
    with patch('requests.post') as mock_post:
        mock_response = Mock()
        mock_response.json.return_value = {
            'access_token': 'test_token',
            'expires_in': 3600
        }
        mock_post.return_value = mock_response
        
        token = oauth_client.exchange_code_for_token('auth_code')
        
        assert token['access_token'] == 'test_token'
```

## Resources

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
