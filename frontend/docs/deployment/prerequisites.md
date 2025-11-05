# Prerequisites

**Distribution Management System**
**Version**: 1.0.0
**Last Updated**: 2025-11-05

---

## Overview

This document lists all prerequisites required to develop, build, and deploy the Distribution Management System.

---

## Required Software

### 1. Node.js (v18.17.0 or later)

**Why**: JavaScript runtime for Next.js and build tools

**Installation**:

#### Windows
```bash
# Download from official website
https://nodejs.org/en/download/

# Or use Chocolatey
choco install nodejs-lts

# Or use Scoop
scoop install nodejs-lts
```

#### macOS
```bash
# Using Homebrew
brew install node@18

# Or download from official website
https://nodejs.org/en/download/
```

#### Linux (Ubuntu/Debian)
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v18.17.0+
npm --version   # Should be v9.0.0+
```

---

### 2. npm or pnpm (Package Manager)

**Why**: Manage project dependencies

**npm** comes bundled with Node.js.

**pnpm** (recommended for faster installs):

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version  # Should be v8.0.0+
```

---

### 3. Git (v2.30.0 or later)

**Why**: Version control and deployment

**Installation**:

#### Windows
```bash
# Download from official website
https://git-scm.com/download/win

# Or use Chocolatey
choco install git
```

#### macOS
```bash
# Using Homebrew
brew install git

# Or use Xcode Command Line Tools
xcode-select --install
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install git

# Verify installation
git --version  # Should be v2.30.0+
```

---

### 4. Code Editor

**Recommended**: Visual Studio Code

**Installation**:
```bash
# Download from official website
https://code.visualstudio.com/

# Recommended VS Code Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features
- GitLens
```

**Alternative Editors**:
- WebStorm
- Sublime Text
- Vim/Neovim with LSP

---

## Required Accounts

### 1. Supabase Account

**Why**: Backend-as-a-Service (Database, Auth, Realtime, Storage)

**Setup**:
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, GitLab, or email
4. Verify your email address

**Free Tier Limits**:
- 500 MB database storage
- 1 GB file storage
- 2 GB bandwidth
- Unlimited API requests
- 50,000 monthly active users

**Upgrade Options**:
- Pro Plan: $25/month (8 GB database, 100 GB storage)
- Team Plan: $599/month (Dedicated resources)
- Enterprise: Custom pricing

---

### 2. Vercel Account (for deployment)

**Why**: Frontend hosting and deployment platform

**Setup**:
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with GitHub, GitLab, or Bitbucket
3. Grant repository access permissions

**Free Tier Limits**:
- Unlimited deployments
- 100 GB bandwidth/month
- Serverless function executions: 100 GB-hours/month
- 6,000 build minutes/month

**Upgrade Options**:
- Pro Plan: $20/month/user
- Enterprise: Custom pricing

---

### 3. GitHub Account (for version control)

**Why**: Code repository and CI/CD integration

**Setup**:
1. Go to [https://github.com](https://github.com)
2. Sign up with email
3. Set up SSH keys or Personal Access Token

**SSH Key Setup**:
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Start SSH agent
eval "$(ssh-agent -s)"

# Add SSH key
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub
# Add to GitHub: Settings > SSH and GPG keys > New SSH key
```

---

## Optional Tools

### 1. PostgreSQL Client (Optional)

**Why**: Direct database access for debugging

**Recommended**: pgAdmin 4 or DBeaver

**Installation**:
```bash
# pgAdmin 4
https://www.pgadmin.org/download/

# DBeaver (Universal database tool)
https://dbeaver.io/download/
```

---

### 2. Postman or Insomnia (Optional)

**Why**: API testing and debugging

**Installation**:
```bash
# Postman
https://www.postman.com/downloads/

# Insomnia
https://insomnia.rest/download
```

---

### 3. Docker (Optional)

**Why**: Local Supabase development environment

**Installation**:

#### Windows
```bash
# Download Docker Desktop
https://www.docker.com/products/docker-desktop/

# Or use Chocolatey
choco install docker-desktop
```

#### macOS
```bash
# Download Docker Desktop
https://www.docker.com/products/docker-desktop/

# Or use Homebrew
brew install --cask docker
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Verify installation
docker --version
docker-compose --version
```

---

## System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **OS** | Windows 10+, macOS 10.15+, Ubuntu 20.04+ |
| **CPU** | 2 cores |
| **RAM** | 4 GB |
| **Storage** | 10 GB free space |
| **Internet** | Broadband connection |

### Recommended Requirements

| Component | Requirement |
|-----------|-------------|
| **OS** | Windows 11, macOS 13+, Ubuntu 22.04+ |
| **CPU** | 4+ cores |
| **RAM** | 8+ GB |
| **Storage** | 20+ GB SSD |
| **Internet** | High-speed broadband |

---

## Network Requirements

### Required Ports

| Port | Service | Purpose |
|------|---------|---------|
| **3000** | Next.js Dev Server | Local development |
| **5432** | PostgreSQL | Database (if running locally) |
| **54321** | Supabase Studio | Local Supabase dashboard |

### Firewall Configuration

Ensure the following domains are accessible:

```
# Supabase Services
*.supabase.co
*.supabase.io

# Vercel Deployment
*.vercel.app
*.vercel.com

# npm Registry
registry.npmjs.org

# GitHub
github.com
*.github.com

# CDNs
cdn.jsdelivr.net
unpkg.com
```

---

## Browser Requirements

### Supported Browsers

| Browser | Minimum Version |
|---------|-----------------|
| **Chrome** | v90+ |
| **Firefox** | v88+ |
| **Safari** | v14+ |
| **Edge** | v90+ |

### Required Browser Features

- ✅ JavaScript enabled
- ✅ Cookies enabled
- ✅ WebSocket support
- ✅ Local Storage enabled
- ✅ Session Storage enabled

---

## Knowledge Prerequisites

### Required Skills

1. **JavaScript/TypeScript** - Intermediate level
2. **React** - Intermediate level
3. **Next.js** - Basic understanding
4. **Git** - Basic commands
5. **SQL** - Basic queries
6. **Command Line** - Basic commands

### Recommended Knowledge

1. **PostgreSQL** - Advanced queries and indexing
2. **Authentication** - JWT, session management
3. **REST APIs** - Request/response patterns
4. **Real-time Systems** - WebSocket, subscriptions
5. **CSS/Tailwind** - Styling and responsive design

---

## Verification Checklist

Before proceeding to environment setup, verify all prerequisites:

```bash
# Node.js
node --version
# Expected: v18.17.0 or later

# npm
npm --version
# Expected: v9.0.0 or later

# Git
git --version
# Expected: v2.30.0 or later

# Optional: pnpm
pnpm --version
# Expected: v8.0.0 or later

# Optional: Docker
docker --version
docker-compose --version
```

### Account Verification

- [ ] Supabase account created and verified
- [ ] Vercel account created and connected to GitHub
- [ ] GitHub account created with SSH keys configured
- [ ] Code editor installed with recommended extensions

---

## Troubleshooting

### Node.js Issues

**Problem**: `node: command not found`

**Solution**:
```bash
# Windows: Add Node.js to PATH
setx PATH "%PATH%;C:\Program Files\nodejs"

# macOS/Linux: Add to shell profile
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

### npm Installation Errors

**Problem**: `EACCES: permission denied`

**Solution**:
```bash
# Never use sudo with npm
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

### Git Authentication Errors

**Problem**: `Permission denied (publickey)`

**Solution**:
```bash
# Test SSH connection
ssh -T git@github.com

# If failed, regenerate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"
ssh-add ~/.ssh/id_ed25519

# Add public key to GitHub
cat ~/.ssh/id_ed25519.pub
```

---

## Next Steps

Once all prerequisites are installed and verified:

1. ✅ Proceed to [Environment Setup](./environment-setup.md)
2. Set up your `.env.local` file
3. Configure Supabase project
4. Run database migrations
5. Start development server

---

## Related Documentation

- [Environment Setup](./environment-setup.md) - Configure environment variables
- [Database Setup](./database-setup.md) - Initialize database schema
- [Supabase Configuration](./supabase-config.md) - Configure Supabase project
- [Frontend Deployment](./frontend-deployment.md) - Deploy to Vercel
- [CI/CD Pipeline](./ci-cd.md) - Automated testing and deployment

---

**End of Prerequisites Documentation**
