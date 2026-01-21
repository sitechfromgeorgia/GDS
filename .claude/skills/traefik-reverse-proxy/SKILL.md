---
name: configuring-traefik-v3-reverse-proxy-ssl
description: Configures Traefik v3 as a Docker-based reverse proxy with zero-config SSL via Let's Encrypt, HTTP-01/DNS-01 ACME challenges, and production-ready middleware chains (headers, basic auth, rate limiting). Use when deploying containerized services requiring automatic HTTPS, routing rules via Docker labels, or when the user mentions Traefik, reverse proxy, Let's Encrypt automation, Docker ingress, or SSL/TLS middleware.
---

# Traefik v3 Reverse Proxy & SSL Automation

## Quick Start

### 1. Static Configuration (`traefik.yml`)

```yaml
log:
  level: INFO

api:
  insecure: false
  dashboard: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: "proxy"
  file:
    filename: "/etc/traefik/dynamic.yml"
    watch: true

certificatesResolvers:
  letsencrypt:
    acme:
      email: "admin@example.com"
      storage: "/letsencrypt/acme.json"
      # Use HTTP-01 for standard certs; DNS-01 for wildcards
      httpChallenge:
        entryPoint: web
```

### 2. Dynamic Configuration (`dynamic.yml`)

```yaml
http:
  middlewares:
    # Security headers middleware
    secure-headers:
      headers:
        stsSeconds: 31536000
        stsPreload: true
        contentTypeNosniff: true
        frameDeny: true
        browserXssFilter: true
        contentSecurityPolicy: "default-src 'self'; script-src 'self'; object-src 'none';"
        referrerPolicy: "no-referrer-when-downgrade"
        permissionsPolicy: "geolocation=(), microphone=()"

    # Basic auth for dashboard
    dashboard-auth:
      basicAuth:
        users:
          - "admin:$apr1$H6uskkkW$IgXLP6ewTrSuBkTrqE8wj/"  # admin:password
        realm: "Traefik Dashboard"
        removeHeader: true

    # Rate limiting
    rate-limit:
      rateLimit:
        average: 100
        period: 1s
        burst: 200
        sourceCriterion:
          ipStrategy:
            depth: 2

    # Secure chain: headers + rate limit
    secured-chain:
      chain:
        middlewares:
          - secure-headers
          - rate-limit

  routers:
    # Traefik Dashboard (requires HTTPS)
    traefik-dashboard:
      rule: "Host(`traefik.example.com`)"
      service: api@internal
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      middlewares:
        - dashboard-auth
```

### 3. Docker Compose (Traefik + Example App)

```yaml
version: '3.9'

services:
  traefik:
    image: traefik:v3.5
    container_name: traefik
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    networks:
      - proxy
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    environment:
      - TZ=UTC
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/traefik.yml:ro
      - ./dynamic.yml:/etc/traefik/dynamic.yml:ro
      - ./letsencrypt:/letsencrypt
      - ./config:/config:ro
    labels:
      - "traefik.enable=true"

  whoami:
    image: traefik/whoami:v1.10
    container_name: whoami
    restart: unless-stopped
    networks:
      - proxy
    labels:
      # Enable service in Traefik
      - "traefik.enable=true"
      # HTTP router (auto-redirect to HTTPS)
      - "traefik.http.routers.whoami.rule=Host(`whoami.example.com`)"
      - "traefik.http.routers.whoami.entrypoints=web,websecure"
      - "traefik.http.routers.whoami.tls=true"
      - "traefik.http.routers.whoami.tls.certresolver=letsencrypt"
      # HTTPS-only router (better practice)
      - "traefik.http.routers.whoami-secure.rule=Host(`whoami.example.com`)"
      - "traefik.http.routers.whoami-secure.entrypoints=websecure"
      - "traefik.http.routers.whoami-secure.tls=true"
      - "traefik.http.routers.whoami-secure.tls.certresolver=letsencrypt"
      - "traefik.http.routers.whoami-secure.middlewares=secured-chain"
      # Service definition
      - "traefik.http.services.whoami.loadbalancer.server.port=80"

networks:
  proxy:
    driver: bridge
    name: proxy
```

## When to Use This Skill

- Deploying microservices on Docker requiring automatic HTTPS
- Setting up reverse proxy with Let's Encrypt certificate automation
- Implementing middleware chains (security headers, rate limiting, auth)
- Migrating from Traefik v2 to v3
- Configuring Docker provider for dynamic service discovery
- Securing dashboard access with basic authentication
- Troubleshooting routing and certificate issues

## Key Concepts

### Static vs Dynamic Configuration

| Aspect | Static (`traefik.yml`) | Dynamic (`dynamic.yml`) |
| :-- | :-- | :-- |
| Loaded | On startup | Hot-reloaded on change |
| Purpose | Core settings, providers, entrypoints, resolvers | Routers, services, middlewares |
| Reload Required | Restart container | Automatic (watch: true) |
| Example | EntryPoints, ACME config | Middleware chains, routing rules |

**Best Practice**: Store static config in Docker Compose `command` or mounted file, dynamic config in mounted `dynamic.yml`.

### ACME Challenge Types

| Challenge | Use Case | Requirements | Wildcard Support |
| :-- | :-- | :-- | :-- |
| HTTP-01 | Standard certs for single domains | Port 80 must be accessible | ❌ No |
| DNS-01 | Wildcards, internal services | DNS API credentials (Cloudflare, etc.) | ✅ Yes |
| TLS-ALPN-01 | HTTPS-only validation | Port 443 must be accessible | ❌ No |

**Recommendation**: Use HTTP-01 for public single domains; DNS-01 for wildcards or internal networks.

### Docker Labels Priority

When a router label is missing, Traefik defaults to:

- EntryPoints: all defined (web + websecure)
- TLS: disabled by default
- Middleware: none applied

Always explicitly define `entrypoints`, `tls.certresolver`, and `middlewares` for production services.

## Instructions

### Step 1: Create Traefik Configuration Files

```bash
mkdir -p traefik/{config,letsencrypt}
touch traefik/traefik.yml traefik/dynamic.yml docker-compose.yml

# Set correct permissions for acme.json directory
chmod 700 traefik/letsencrypt
```

### Step 2: Configure Let's Encrypt

**HTTP-01 (standard)**

```yaml
# traefik.yml
certificatesResolvers:
  letsencrypt:
    acme:
      email: "admin@example.com"
      storage: "/letsencrypt/acme.json"
      httpChallenge:
        entryPoint: web
```

**DNS-01 (wildcard)**

```yaml
# traefik.yml
certificatesResolvers:
  letsencrypt:
    acme:
      email: "admin@example.com"
      storage: "/letsencrypt/acme.json"
      dnsChallenge:
        provider: digitalocean   # or cloudflare, route53, etc.
        delayBeforeCheck: 10
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"
```

Set provider credentials as environment variables:

```bash
# DigitalOcean example
export DO_AUTH_TOKEN="dop_v1_xxxxxxxxxxxx"

# Cloudflare example
export CF_DNS_API_TOKEN="v1.0xx_xxxxxxxxxxxx"
```

### Step 3: Set Up Middleware Chains

```yaml
http:
  middlewares:
    # Individual middlewares
    headers-secure:
      headers:
        stsSeconds: 31536000
        stsPreload: true
        contentTypeNosniff: true
        frameDeny: true
    
    auth-dashboard:
      basicAuth:
        users:
          - "admin:$apr1$H6uskkkW$IgXLP6ewTrSuBkTrqE8wj/"
    
    compression:
      compress: {}
    
    # Chained middleware (apply multiple at once)
    public-api:
      chain:
        middlewares:
          - headers-secure
          - compression
    
    protected-api:
      chain:
        middlewares:
          - auth-dashboard
          - headers-secure
          - rate-limit
```

### Step 4: Deploy Services with Docker Labels

```yaml
labels:
  # Enable Traefik for this service
  - "traefik.enable=true"
  
  # Router definition (HTTP)
  - "traefik.http.routers.myapp.rule=Host(`myapp.example.com`)"
  - "traefik.http.routers.myapp.entrypoints=web"
  
  # Router definition (HTTPS)
  - "traefik.http.routers.myapp-secure.rule=Host(`myapp.example.com`)"
  - "traefik.http.routers.myapp-secure.entrypoints=websecure"
  - "traefik.http.routers.myapp-secure.tls=true"
  - "traefik.http.routers.myapp-secure.tls.certresolver=letsencrypt"
  - "traefik.http.routers.myapp-secure.middlewares=public-api"
  
  # Service port mapping
  - "traefik.http.services.myapp.loadbalancer.server.port=3000"
  
  # Load balancer (optional)
  - "traefik.http.services.myapp.loadbalancer.passhostheader=true"
```

### Step 5: Verify acme.json Permissions

```bash
# After first container start, verify permissions
ls -la traefik/letsencrypt/acme.json
# Should show: -rw------- (600)

chmod 600 traefik/letsencrypt/acme.json
```

## Code Examples

### Example 1: Public Service with Security Headers & Rate Limiting

```yaml
services:
  api:
    image: myapi:latest
    networks:
      - proxy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.example.com`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls=true"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.routers.api.middlewares=secured-chain"
      - "traefik.http.services.api.loadbalancer.server.port=8000"
      - "traefik.http.services.api.loadbalancer.healthcheck.path=/health"
      - "traefik.http.services.api.loadbalancer.healthcheck.interval=30s"

networks:
  proxy:
    external: true
```

### Example 2: Internal Service with Basic Auth

```yaml
# dynamic.yml
http:
  middlewares:
    admin-auth:
      basicAuth:
        users:
          - "admin:$apr1$H6uskkkW$IgXLP6ewTrSuBkTrqE8wj/"
        realm: "Admin Panel"
        removeHeader: true

  routers:
    admin-panel:
      rule: "Host(`admin.internal.local`)"
      service: admin-svc
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      middlewares:
        - admin-auth
```

### Example 3: Multiple Subdomains with Wildcard Certificate

```yaml
# traefik.yml (DNS-01 required for wildcards)
certificatesResolvers:
  letsencrypt:
    acme:
      email: "admin@example.com"
      storage: "/letsencrypt/acme.json"
      dnsChallenge:
        provider: cloudflare
```

```yaml
# dynamic.yml
http:
  routers:
    catch-all:
      rule: "HostRegexp(`{subdomain:[a-z]+}.example.com`) || Host(`example.com`)"
      service: main-app
      tls:
        certResolver: letsencrypt
        domains:
          - main: "example.com"
            sans:
              - "*.example.com"
```

### Example 4: Environment-Based Configuration

```yaml
version: '3.9'

services:
  traefik:
    image: traefik:v3.5
    environment:
      - LETSENCRYPT_EMAIL=${LE_EMAIL:-admin@example.com}
      - DO_AUTH_TOKEN=${DO_TOKEN}
    command:
      - "--certificatesresolvers.letsencrypt.acme.email=${LE_EMAIL:-admin@example.com}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.dnschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.dnschallenge.provider=digitalocean"
    volumes:
      - ./letsencrypt:/letsencrypt
```

## Best Practices

1. **HTTPS-Only Entrypoints**
```yaml
labels:
  - "traefik.http.routers.app.entrypoints=websecure"
  - "traefik.http.routers.app.tls=true"
  - "traefik.http.routers.app.tls.certresolver=letsencrypt"
```

2. **Explicit Middleware**
```yaml
labels:
  - "traefik.http.routers.app.middlewares=secured-chain"
```

3. **Use Staging ACME First**
```yaml
certificatesResolvers:
  letsencrypt-staging:
    acme:
      email: "admin@example.com"
      storage: "/letsencrypt/acme-staging.json"
      caServer: "https://acme-staging-v02.api.letsencrypt.org/directory"
      httpChallenge:
        entryPoint: web
```

4. **Persist acme.json**
```yaml
volumes:
  - ./letsencrypt:/letsencrypt
```

5. **Rate Limit Behind Proxies**
```yaml
rateLimit:
  sourceCriterion:
    ipStrategy:
      depth: 2
```

6. **DNS-01 for Wildcards/Internal**
```yaml
dnsChallenge:
  provider: cloudflare
  delayBeforeCheck: 10
```

7. **Protect Dashboard with Auth**
```yaml
middlewares:
  dashboard-auth:
    basicAuth:
      users:
        - "admin:$apr1$H6uskkkW$IgXLP6ewTrSuBkTrqE8wj/"
```

8. **Security Headers Middleware**
```yaml
middlewares:
  headers-standard:
    headers:
      stsSeconds: 31536000
      contentTypeNosniff: true
      frameDeny: true
      browserXssFilter: true
      contentSecurityPolicy: "default-src 'self'"
```

## Common Errors & Solutions

### 1. `404 Page Not Found`

- Fix Host rule syntax:

```yaml
labels:
  - "traefik.http.routers.app.rule=Host(`app.example.com`)"  # backticks required
```

- Check service running and accessible.
- Use dashboard to see if router/service exist.
- Enable `log.level=DEBUG` to inspect.

### 2. Certificate Not Issued

- Check DNS resolution (`nslookup app.example.com`).
- Ensure port 80 reachable (HTTP-01).
- For DNS-01, verify TXT record (`dig _acme-challenge...`).
- Check ACME logs (`docker logs traefik | grep -i acme`).

### 3. `acme.json permission denied`

```bash
chmod 600 traefik/letsencrypt/acme.json
```

### 4. `middleware not found`

Define middleware before using:

```yaml
http:
  middlewares:
    my-headers:
      headers:
        stsSeconds: 31536000
  
  routers:
    app:
      middlewares:
        - my-headers
```

### 5. TLS handshake failure

- Hard refresh.
- `curl -v https://app.example.com`
- Inspect certificate (`openssl s_client -connect ...`).

### 6. Service not appearing

Add:

```yaml
labels:
  - "traefik.enable=true"
```

## References

- https://doc.traefik.io/traefik/
- https://doc.traefik.io/traefik/https/acme/
- https://doc.traefik.io/traefik/middlewares/http/
- https://doc.traefik.io/traefik/providers/docker/
- https://letsencrypt.org/
- https://go-acme.github.io/lego/dns/
- `htpasswd` from Apache utils
