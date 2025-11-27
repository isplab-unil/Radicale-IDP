# Radicale-IDP Docker Deployment Guide

Complete guide to deploy Radicale-IDP (CalDAV/CardDAV server with Privacy Extensions) on a Linux server via Docker.

**Table of Contents**
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Environment Configuration](#environment-configuration)
5. [Server Configuration](#server-configuration)
6. [Deployment Options](#deployment-options)
7. [Reverse Proxy & SSL](#reverse-proxy--ssl)
8. [Privacy System Overview](#privacy-system-overview)
9. [Operations & Maintenance](#operations--maintenance)
10. [Troubleshooting](#troubleshooting)
11. [Quick Reference](#quick-reference)

---

## Overview

Radicale-IDP is a CalDAV/CardDAV server built on Radicale with integrated privacy extensions that allow users to control which personal information is shared in their contact cards (vCards).

### Key Features

- **CalDAV/CardDAV Server**: Full-featured calendar and contact server
- **Privacy Controls**: Users can hide sensitive fields (photo, birthday, address, etc.) from their vCards
- **Web UI**: React-based interface for managing privacy preferences
- **Multi-Protocol**: Supports CalDAV, CardDAV, and WebDAV standards
- **Docker Native**: Production-ready containerized deployment

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Nginx (Docker Container)                    │
│     [SSL/TLS termination, reverse proxy, HTTP/HTTPS]        │
│                    Ports: 80 (HTTP), 443 (HTTPS)            │
└────────────────────────┬────────────────────────────────────┘
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
     ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Radicale    │  │  Web App     │  │  Certbot     │
│  (port 5232) │  │  (port 3000) │  │  (SSL mgmt)  │
│              │  │              │  │              │
│ • CalDAV     │  │ • React UI   │  │ • Self-sign  │
│ • CardDAV    │  │ • OTP Auth   │  │ • Let's Enc. │
│ • Privacy    │  │ • DB queries │  │ • Auto-renew │
└──────────────┘  └──────────────┘  └──────────────┘
     │                   │                   │
     └───────────────────┼───────────────────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
           ▼                           ▼
    ┌──────────────────┐      ┌──────────────────┐
    │  Radicale Data   │      │  Web App Data    │
    │  • Collections   │      │  • Sessions      │
    │  • Privacy DB    │      │  • User data     │
    │  • vCards        │      │                  │
    └──────────────────┘      └──────────────────┘
```

### What's Included

- `docker compose.yml` - Service orchestration with nginx, certbot, radicale, and web services
- `Dockerfile.local` - Build Radicale from local source with privacy extensions
- `.env.example` - Environment variable template
- `config/radicale.config` - Radicale server configuration
- `volumes/certbot/certbot-entrypoint.sh` - Automated SSL certificate management
- `volumes/nginx/nginx-entrypoint.sh` - Dynamic nginx SSL configuration
- `volumes/nginx/conf.d/default.conf.template` - Nginx configuration template
- `scripts/backup.sh` - Automated backup tool
- `scripts/health-check.sh` - System monitoring with SSL validation
- `scripts/init-web-db.sh` - Database initialization

---

## Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu 20.04+, Debian 11+, or similar)
- **SSH Access**: Server accessible only via SSH with sudo privileges
- **Docker**: 20.10+ with Docker Compose 2.0+
- **Resources**: 1GB+ RAM recommended, 10GB disk space
- **Python 3.8+**: Already in Docker containers

### Before You Start

Determine and have ready:
1. Server domain name or IP address
2. Strong random tokens (generate with `openssl rand -hex 32`)
   - `RADICALE_TOKEN` - Privacy API authentication
   - `JWT_SECRET` - Web app session signing
3. AWS credentials (optional - for OTP email/SMS)
   - `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
   - Or use `MOCK_EMAIL=true` and `MOCK_SMS=true` for development

### Installation Check

On your server, verify Docker is installed:

```bash
docker --version      # Should be 20.10+
docker compose --version  # Should be 2.0+
```

If not installed, see the [Troubleshooting](#troubleshooting) section.

---

## Quick Start

Get Radicale-IDP running in 10 minutes.

### Step 1: Clone Repository

```bash
ssh user@your-server.com

mkdir -p /opt/radicale-idp
cd /opt/radicale-idp

git clone https://github.com/isplab-unil/Radicale-IDP.git .
```

### Step 2: Generate Security Tokens

```bash
RADICALE_TOKEN=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

echo "RADICALE_TOKEN=$RADICALE_TOKEN"
echo "JWT_SECRET=$JWT_SECRET"
```

Save these tokens - you'll need them in the next step.

### Step 3: Configure Environment

```bash
cp .env.example .env
nano .env
```

Set at minimum:
```ini
RADICALE_TOKEN=<paste-token-from-step-2>
JWT_SECRET=<paste-token-from-step-2>

# For OTP email/SMS in development (no AWS credentials needed)
MOCK_EMAIL=true
MOCK_SMS=true
```

Secure the file:
```bash
chmod 600 .env
```

### Step 4: Start Services

**For development/testing**:
```bash
docker compose up -d
```

**For production**:
```bash
docker compose -f docker compose.yml -f docker compose.prod.yml up -d
```

Docker automatically manages volume creation and permissions.

### Step 5: Verify Deployment

```bash
# Check services status
docker compose ps

# Run health check
./scripts/health-check.sh

# View logs
docker compose logs -f
```

Both services should show as "Up" and healthy.

### Step 6: Access Services

**From your local machine** (SSH-only server):
```bash
ssh -L 5232:localhost:5232 -L 3000:localhost:3000 user@your-server.com
```

Then open in your browser:
- Radicale: `http://localhost:5232/`
- Web App: `http://localhost:3000/web`

**For persistent access**, add to `~/.ssh/config`:
```
Host radicale-server
    HostName your-server.com
    User your-username
    LocalForward 5232 127.0.0.1:5232
    LocalForward 3000 127.0.0.1:3000
```

Then: `ssh radicale-server` (tunnels run in background)

---

## Docker Management

Docker Compose manages all containers, volumes, and networking. No manual setup of directories or permissions needed.

### Understanding Docker Compose

The deployment uses two configuration files:
- `docker compose.yml` - Base configuration (development defaults)
- `docker compose.prod.yml` - Production overrides (applied on top)

When you use both: `docker compose -f docker compose.yml -f docker compose.prod.yml up -d`

### Building Images

Build Docker images from Dockerfiles:

```bash
# Build all images
docker compose build

# Build specific service
docker compose build web
docker compose build radicale

# Force rebuild (ignore cache)
docker compose build --no-cache web
```

**When to rebuild**:
- After pulling code changes (`git pull`)
- After updating dependencies (Dockerfile changes, package.json updates)
- When troubleshooting deployment issues
- After updating the `.env` file (variables used in builds)

### Starting and Stopping Services

**Start services**:
```bash
# Development (background)
docker compose up -d

# Production (background)
docker compose -f docker compose.yml -f docker compose.prod.yml up -d

# Foreground (see output directly)
docker compose up
```

**Stop services**:
```bash
# Stop containers (keeps all data)
docker compose down

# Stop and remove all volumes (REMOVES ALL DATA!)
docker compose down -v
```

### Viewing Logs

```bash
# All services, real-time
docker compose logs -f

# Specific service
docker compose logs -f radicale
docker compose logs -f web

# Last 50 lines
docker compose logs --tail=50

# With timestamps
docker compose logs -f -t

# Stop log viewing: press Ctrl+C
```

### Checking Status

```bash
# List running containers
docker compose ps

# Show all containers (including stopped)
docker compose ps -a

# Show resource usage (CPU, memory, network)
docker stats

# Check specific container details
docker compose ps web
```

### Common Workflows

**Update code and redeploy:**
```bash
cd /opt/radicale-idp

# Get latest code
git pull

# Rebuild images
docker compose build

# Stop old containers
docker compose down

# Start with new images
docker compose -f docker compose.yml -f docker compose.prod.yml up -d

# Check logs
docker compose logs -f
```

**Quick restart (keeps data)**:
```bash
docker compose restart
# or
docker compose down && docker compose up -d
```

**Complete rebuild (removes all data)**:
```bash
# CAUTION: This removes all data! Create backup first!
docker compose down -v              # Stop and remove volumes
docker compose build --no-cache     # Rebuild from scratch
docker compose up -d                # Start fresh
docker compose logs -f              # Watch startup
```

**Troubleshooting workflow**:
```bash
# Check status
docker compose ps

# View logs
docker compose logs web

# Rebuild specific service
docker compose build --no-cache web

# Restart service
docker compose down web
docker compose up -d web

# Check logs again
docker compose logs -f web
```

---

## Environment Configuration

### Complete .env Reference

All configuration is managed through environment variables. Copy `.env.example` to `.env` and customize.

**Note**: Docker automatically manages volume creation and permissions. No manual directory setup or `chmod`/`chown` commands needed - just copy the `.env` file and start the containers!

```ini
# ====== CRITICAL - Security Tokens ======
# Privacy API authentication token (32+ random characters)
RADICALE_TOKEN=<generate-with-openssl-rand-hex-32>

# Web app session signing (32+ random characters)
JWT_SECRET=<generate-with-openssl-rand-hex-32>

# ====== SSL/TLS Configuration ======
# SSL certificate mode: true = self-signed (development), false = Let's Encrypt (production)
SELF_SIGNED_SSL=true

# Domain name (required for Let's Encrypt mode when SELF_SIGNED_SSL=false)
DOMAIN=your-domain.com

# Email for Let's Encrypt notifications (required when SELF_SIGNED_SSL=false)
EMAIL=admin@your-domain.com

# ====== AWS Configuration (Optional) ======
# Leave blank or use MOCK_* flags for development

# AWS region for SES (email) and SNS (SMS)
AWS_REGION=us-east-1

# AWS credentials for OTP delivery
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Email sender address (must be verified in AWS SES)
EMAIL_FROM=noreply@your-domain.com
EMAIL_FROM_NAME=Radicale IDP

# SMS sender ID (must be registered in AWS SNS)
SMS_FROM=RadicalIDP

# ====== Mock Mode (Development) ======
# Set to 'true' to skip AWS and use mock OTP delivery
MOCK_EMAIL=false
MOCK_SMS=false

# Mock email output directory (when MOCK_EMAIL=true)
MOCK_EMAIL_OUTPUT_DIR=/var/lib/radicale/mock_emails

# ====== Radicale Configuration ======
# Server host/port (127.0.0.1 = localhost only)
RADICALE_HOST=127.0.0.1
RADICALE_PORT=5232

# Storage type and path
RADICALE_STORAGE_TYPE=multifilesystem
RADICALE_STORAGE_FILESYSTEM_FOLDER=/var/lib/radicale/collections

# Logging level: debug, info, warning, error
RADICALE_LOG_LEVEL=info

# ====== Privacy Database ======
# Path to SQLite privacy settings database
PRIVACY_DB_PATH=/var/lib/radicale/privacy.db

# Default privacy settings for new users (true = disallow sharing)
DEFAULT_DISALLOW_PHOTO=false
DEFAULT_DISALLOW_GENDER=false
DEFAULT_DISALLOW_BIRTHDAY=false
DEFAULT_DISALLOW_ADDRESS=false
DEFAULT_DISALLOW_COMPANY=false
DEFAULT_DISALLOW_TITLE=false

# ====== Web Application ======
# Web app host/port
WEB_HOST=127.0.0.1
WEB_PORT=3000

# Web app database path
WEB_DB_PATH=/data/local.db

# Web app log level
WEB_LOG_LEVEL=info

# ====== Authentication ======
# Radicale auth type: none (development), htpasswd (production)
RADICALE_AUTH_TYPE=none

# Path to htpasswd file (if using htpasswd auth)
RADICALE_AUTH_HTPASSWD_FILE=/etc/radicale/users

# htpasswd encryption: plain, sha1, ssha, md5, crypt
RADICALE_AUTH_HTPASSWD_ENCRYPTION=sha1

# ====== Additional Settings ======
# Debug mode (only in development)
DEBUG=false

# OTP validity period (seconds)
OTP_EXPIRY=600

# OTP code length
OTP_LENGTH=6
```

### Key Configuration Details

**RADICALE_TOKEN**
- Controls access to Privacy API endpoints
- Must be at least 32 random characters
- Used as Bearer token for API authentication
- Should be kept secret

Generate with: `openssl rand -hex 32`

**JWT_SECRET**
- Signs session tokens for web app authentication
- Must be at least 32 random characters
- Used for OTP validation
- Changing this invalidates all active sessions

Generate with: `openssl rand -hex 32`

**SSL/TLS Configuration**
- **SELF_SIGNED_SSL**: Controls certificate mode
  - `true` (default): Use self-signed certificates for development
  - `false`: Use Let's Encrypt certificates for production
- **DOMAIN**: Your domain name (required when `SELF_SIGNED_SSL=false`)
  - Must point to your server's IP address
  - Example: `radicale.example.com`
- **EMAIL**: Contact email for Let's Encrypt (required when `SELF_SIGNED_SSL=false`)
  - Used for certificate expiration notifications
  - Example: `admin@example.com`

**SSL Certificate Management**
- Fully automated via certbot-entrypoint.sh
- Development mode: Generates and auto-renews self-signed certificates
- Production mode: Obtains and auto-renews Let's Encrypt certificates
- No manual intervention required

**AWS Credentials (for OTP)**
- Required if MOCK_EMAIL and MOCK_SMS are false
- AWS SES for email delivery
- AWS SNS for SMS delivery
- EMAIL_FROM must be verified in AWS SES

**Mock Mode (Development)**
- Set `MOCK_EMAIL=true` and `MOCK_SMS=true` to disable AWS
- OTP codes written to files instead of sent
- Check `MOCK_EMAIL_OUTPUT_DIR` for generated codes

**Privacy Defaults**
- Applied to new users automatically
- Users can change their own preferences via web UI
- Six fields are filterable: photo, gender, birthday, address, company, title

---

## Server Configuration

### Radicale Configuration File

Located at `config/radicale.config` (loaded into container from `.env`).

#### Critical Sections

**[storage]**
```ini
[storage]
type = multifilesystem
filesystem_folder = /var/lib/radicale/collections
```
Stores calendar and contact data.

**[privacy]**
```ini
[privacy]
type = database
database_path = /var/lib/radicale/privacy.db
default_disallow_photo = false
default_disallow_gender = false
default_disallow_birthday = false
default_disallow_address = false
default_disallow_company = false
default_disallow_title = false
```
Configures privacy feature storage and defaults. All paths in Docker are `/var/lib/radicale/`.

**[auth]**
```ini
[auth]
type = none
```

Options:
- `none` - No authentication (development only)
- `htpasswd` - Password file authentication (production)

For production, create htpasswd file and set:
```ini
[auth]
type = htpasswd
htpasswd_filename = /etc/radicale/users
htpasswd_encryption = sha1
```

**[rights]**
```ini
[rights]
type = authenticated
```

Must be `authenticated` for privacy features to work. This ensures only authenticated users can access vCards.

**[logging]**
```ini
[logging]
level = info
```

Options: `debug`, `info`, `warning`, `error`. Use `debug` for troubleshooting.

#### Authentication Methods

**For Development** (`auth = none`)
```ini
[auth]
type = none

[rights]
type = owner_only  # Each user can only see their own data
```

**For Production** (`auth = htpasswd`)

Generate password file:
```bash
htpasswd -c /etc/radicale/users username
# Enter password when prompted
```

Update config:
```ini
[auth]
type = htpasswd
htpasswd_filename = /etc/radicale/users
htpasswd_encryption = sha1

[rights]
type = authenticated  # Privacy features enabled
```

---

## Deployment Options

### Option 1: Development Deployment

**Use case**: Testing, local development, learning

```bash
cd /opt/radicale-idp

# Start services
docker compose up -d

# Services accessible at:
# - Radicale: http://localhost:5232/
# - Web app: http://localhost:3000/web

# View logs
docker compose logs -f

# Stop services (keeps data)
docker compose down

# Stop and remove data
docker compose down -v
```

**Characteristics**:
- Fast startup
- Automatic volume management
- Data persists across container restarts
- Low resource overhead

### Option 2: Production Deployment

**Use case**: Live server, persistent data, backups

Same commands as development deployment. The configuration includes health checks and logging suitable for production use.

```bash
cd /opt/radicale-idp

# Start services
docker compose up -d

# Verify services
docker compose ps

# View logs
docker compose logs -f
```

**Production features included**:
- Health checks with automatic service monitoring
- Log rotation (10MB per file, keep 3 files)
- Automatic restart on failure
- Named volumes for data persistence

**Characteristics**:
- Data persists across container restarts
- Docker-managed named volumes (automatic backup compatible)
- Containers use resources as needed (no artificial limits)
- Zero manual setup required

---

## Reverse Proxy & SSL

Radicale-IDP includes **built-in nginx and certbot containers** that handle reverse proxy and SSL/TLS automatically. No manual nginx or Certbot installation needed!

### How It Works

The system provides **two SSL modes** controlled by the `SELF_SIGNED_SSL` environment variable:

1. **Development Mode** (`SELF_SIGNED_SSL=true`):
   - Automatically generates self-signed certificates
   - Perfect for local development and testing
   - Certificates stored in `volumes/ssl/self-signed/`
   - Auto-renewed 10 days before expiration

2. **Production Mode** (`SELF_SIGNED_SSL=false`):
   - Automatically obtains Let's Encrypt certificates
   - Trusted by all browsers and clients
   - Certificates stored in `volumes/certbot/conf/live/${DOMAIN}/`
   - Auto-renewed 30 days before expiration

### Architecture

**Nginx Container**: Handles HTTP/HTTPS traffic and reverse proxy
- Exposes ports 80 (HTTP) and 443 (HTTPS)
- Routes traffic to radicale (port 5232) and web (port 3000) containers
- Dynamic SSL configuration via nginx-entrypoint.sh

**Certbot Container**: Manages SSL certificates
- Generates self-signed certificates in dev mode
- Obtains Let's Encrypt certificates in production mode
- Runs continuously with daily renewal checks
- No manual intervention required

### Development Mode (Default)

Perfect for local testing and development.

**Configuration** (in `.env`):
```bash
SELF_SIGNED_SSL=true
```

**What happens**:
1. Start services: `docker compose up -d`
2. Certbot container generates self-signed certificate on first run
3. Nginx container configures SSL with self-signed certificate
4. Services available at `https://localhost/` (expect browser warning)

**Certificate Management**:
- Location: `volumes/ssl/self-signed/fullchain.pem` and `privkey.pem`
- Valid for: 365 days
- Auto-renewal: 10 days before expiration
- No domain or email configuration needed

### Production Mode

For public-facing deployments with trusted SSL certificates.

**Prerequisites**:
1. **Domain name** pointing to your server's IP address
2. **Ports 80 and 443** open in firewall
3. **DNS propagation** complete (verify with `dig your-domain.com`)

**Configuration** (in `.env`):
```bash
SELF_SIGNED_SSL=false
DOMAIN=radicale.example.com
EMAIL=admin@example.com
```

**What happens**:
1. Start services: `docker compose up -d`
2. Certbot container obtains Let's Encrypt certificate via ACME challenge
3. Nginx container configures SSL with Let's Encrypt certificate
4. Services available at `https://your-domain.com/` (trusted certificate)

**Certificate Management**:
- Location: `volumes/certbot/conf/live/${DOMAIN}/`
- Valid for: 90 days
- Auto-renewal: 30 days before expiration (daily checks)
- Email notifications sent before expiration

### Switching Between Modes

**From Development to Production**:
```bash
# 1. Update .env file
nano .env
# Set:
#   SELF_SIGNED_SSL=false
#   DOMAIN=your-domain.com
#   EMAIL=admin@example.com

# 2. Ensure DNS points to your server
dig your-domain.com

# 3. Restart services
docker compose down
docker compose up -d

# 4. Monitor certificate acquisition
docker compose logs -f certbot
```

**From Production to Development**:
```bash
# 1. Update .env file
nano .env
# Set:
#   SELF_SIGNED_SSL=true

# 2. Restart services
docker compose down
docker compose up -d
```

### SSL Certificate Verification

**Check certificate status**:
```bash
# Run health check (includes SSL validation)
./scripts/health-check.sh

# Check certificate expiration (self-signed mode)
openssl x509 -enddate -noout -in volumes/ssl/self-signed/fullchain.pem

# Check certificate expiration (Let's Encrypt mode)
docker compose exec certbot certbot certificates
```

**View certbot logs**:
```bash
docker compose logs certbot
```

### Manual Certificate Operations

**Force certificate renewal** (Let's Encrypt mode only):
```bash
# Renew certificate
docker compose exec certbot certbot renew --force-renewal

# Restart nginx to load renewed certificate
docker compose restart nginx
```

**Regenerate self-signed certificate**:
```bash
# Remove existing certificate
rm volumes/ssl/self-signed/fullchain.pem volumes/ssl/self-signed/privkey.pem

# Restart certbot to generate new certificate
docker compose restart certbot

# Restart nginx to load new certificate
docker compose restart nginx
```

### Nginx Configuration

Nginx configuration is **dynamically generated** based on SSL mode:
- Template: `volumes/nginx/conf.d/default.conf.template`
- Entrypoint: `volumes/nginx/nginx-entrypoint.sh`
- Final config: Generated at container startup using `envsubst`

**Key features**:
- HTTP to HTTPS redirect
- WebDAV support for CalDAV/CardDAV
- Reverse proxy to radicale (/) and web (/web)
- Proper header forwarding
- ACME challenge endpoint for Let's Encrypt

### Troubleshooting SSL

**Nginx won't start**:
```bash
# Check if certificates exist
ls -la volumes/ssl/self-signed/  # For self-signed mode
docker compose exec certbot ls -la /etc/letsencrypt/live/  # For Let's Encrypt mode

# If missing, restart certbot to generate
docker compose restart certbot
docker compose logs -f certbot
```

**Let's Encrypt certificate acquisition failed**:
```bash
# 1. Verify DNS points to your server
dig your-domain.com
nslookup your-domain.com

# 2. Check firewall allows HTTP (port 80)
sudo ufw status
curl -I http://your-domain.com/.well-known/acme-challenge/test

# 3. Check certbot logs
docker compose logs certbot

# 4. Common issues:
#    - DNS not propagated (wait 24-48 hours)
#    - Port 80 blocked by firewall
#    - Domain doesn't point to server
#    - Let's Encrypt rate limit hit (50 certs/domain/week)
```

**Browser shows "Not Secure" warning**:
- **Expected in development mode** (self-signed certificates)
- In production mode: Verify Let's Encrypt certificate was obtained successfully
- Check certificate expiration: `docker compose exec certbot certbot certificates`

For more detailed SSL documentation, see: `nginx/ssl/README.md`

---

## Privacy System Overview

### How Privacy Works

Radicale-IDP allows users to control which information in their vCards is shared with others.

#### vCard Properties

vCards contain contact information with multiple properties:

| Property | Example | Filterable |
|----------|---------|-----------|
| FN | Full Name | No (always shown) |
| N | Name | No (always shown) |
| EMAIL | email@example.com | No (always shown) |
| TEL | Phone | No (always shown) |
| PHOTO | Image data | Yes |
| GENDER | M/F | Yes |
| BDAY | 1990-01-01 | Yes |
| ADR | Address | Yes |
| ORG | Organization | Yes |
| TITLE | Job title | Yes |

#### Privacy Settings

Users can set individual preferences for:
- **PHOTO**: Hide/show profile picture
- **GENDER**: Hide/show gender
- **BIRTHDAY**: Hide/show birth date
- **ADDRESS**: Hide/show postal address
- **COMPANY**: Hide/show organization/company name
- **TITLE**: Hide/show job title

#### Enforcement

When another user retrieves a vCard:
1. Request arrives at Radicale
2. Privacy system checks requester's permissions
3. Filters vCard based on owner's privacy settings
4. Returns only allowed properties

### Privacy API Endpoints

The Privacy API provides programmatic access to privacy settings.

**Authentication**: Bearer token using `RADICALE_TOKEN`

**Base URL**: `/privacy`

#### Get User's Privacy Settings

```bash
curl -H "Authorization: Bearer $RADICALE_TOKEN" \
  http://localhost:5232/privacy/settings/username
```

Response:
```json
{
  "username": "john",
  "disallow_photo": false,
  "disallow_gender": true,
  "disallow_birthday": true,
  "disallow_address": false,
  "disallow_company": false,
  "disallow_title": false
}
```

#### Update Privacy Settings

```bash
curl -X PUT \
  -H "Authorization: Bearer $RADICALE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "disallow_photo": true,
    "disallow_gender": false,
    "disallow_birthday": false
  }' \
  http://localhost:5232/privacy/settings/username
```

#### Find vCards Containing User Info

```bash
curl -H "Authorization: Bearer $RADICALE_TOKEN" \
  http://localhost:5232/privacy/cards/username
```

#### Reprocess vCards

When privacy settings change, reprocess all vCards:

```bash
curl -X POST \
  -H "Authorization: Bearer $RADICALE_TOKEN" \
  http://localhost:5232/privacy/cards/username/reprocess
```

### Web UI for Privacy Management

React-based web app provides user-friendly interface:

**Access**: `http://your-domain.com/web`

**Features**:
- View current privacy settings
- Update settings per property
- See which vCards contain user's information
- Manage OTP authentication (email/SMS)

**Authentication**:
- First time: OTP via email or SMS
- Subsequent: JWT session token from web app

---

## Operations & Maintenance

### Backup Strategy

Regular backups are critical for production deployments. The backup script works seamlessly with Docker-managed volumes.

#### Automated Backup

```bash
# Run backup script
./scripts/backup.sh

# Backups saved to /backup/radicale-idp/YYYYMMDD_HHMMSS/
# Contents:
#   - collections-*.tar.gz (vCards and calendars)
#   - radicale-data-*.tar.gz (privacy database)
#   - web-data-*.tar.gz (web app database)
#   - config-*.tar.gz (configuration files)
#   - privacy-db-*.sql (privacy database SQL dump)
#   - web-db-*.sql (web app database SQL dump)
#   - .env.backup (configuration - keep secure!)
```

**No special setup needed** - the backup script automatically accesses Docker-managed volumes.

#### Schedule Daily Backups

```bash
# Edit root crontab
sudo crontab -e

# Add line to run daily at 2 AM
0 2 * * * /opt/radicale-idp/scripts/backup.sh
```

#### Restore from Backup

```bash
# List backups
ls /backup/radicale-idp/

# Stop services
docker compose down

# Remove volumes (CAUTION: removes current data!)
docker volume rm radicale-idp_radicale_collections radicale-idp_radicale_data radicale-idp_web_data

# Restore specific backup (example from backup YYYYMMDD_HHMMSS)
cd /backup/radicale-idp/YYYYMMDD_HHMMSS/

# Restore collections
docker run --rm \
  -v radicale-idp_radicale_collections:/collections \
  -v .:/backup:ro \
  alpine tar xzf /backup/collections-*.tar.gz -C /collections

# Restore Radicale data (privacy database)
docker run --rm \
  -v radicale-idp_radicale_data:/data \
  -v .:/backup:ro \
  alpine tar xzf /backup/radicale-data-*.tar.gz -C /data

# Restore web app data
docker run --rm \
  -v radicale-idp_web_data:/data \
  -v .:/backup:ro \
  alpine tar xzf /backup/web-data-*.tar.gz -C /data

# Restart services
docker compose up -d
```

### Health Monitoring

```bash
# Run health check
./scripts/health-check.sh

# Output shows:
# - Service status (running/stopped)
# - Response times
# - Database accessibility
# - Disk usage
# - Resource consumption
```

### Database Maintenance

#### Optimize SQLite

Reclaim unused space:

```bash
# Radicale privacy database
docker compose exec radicale sqlite3 /var/lib/radicale/privacy.db "VACUUM;"

# Web app database
docker compose exec web sqlite3 /data/local.db "VACUUM;"
```

#### Backup Databases

```bash
# Privacy database
docker compose exec radicale sqlite3 /var/lib/radicale/privacy.db ".dump" > privacy-backup.sql

# Web database
docker compose exec web sqlite3 /data/local.db ".dump" > web-backup.sql
```

### Updating Containers

```bash
# Pull latest images
docker compose pull

# Rebuild local image
docker compose build --no-cache radicale

# Restart services
docker compose up -d

# Verify update
docker compose ps
docker compose logs
```

### Viewing Logs

```bash
# Real-time logs (all services)
docker compose logs -f

# Specific service logs
docker compose logs -f radicale
docker compose logs -f web
docker compose logs -f nginx
docker compose logs -f certbot

# Last 100 lines of logs
docker compose logs -f --tail=100

# Logs with timestamps
docker compose logs -f -t

# Multiple services at once
docker compose logs -f radicale web nginx
```

### Token Rotation

Update security tokens periodically:

**Step 1**: Generate new tokens
```bash
NEW_RADICALE_TOKEN=$(openssl rand -hex 32)
NEW_JWT_SECRET=$(openssl rand -hex 32)

echo "New RADICALE_TOKEN: $NEW_RADICALE_TOKEN"
echo "New JWT_SECRET: $NEW_JWT_SECRET"
```

**Step 2**: Update .env
```bash
nano .env
# Update RADICALE_TOKEN and JWT_SECRET
```

**Step 3**: Restart services
```bash
docker compose down
docker compose up -d
```

**Step 4**: Invalidate old tokens
- Update any API clients using old RADICALE_TOKEN
- Users will need to re-authenticate (web sessions cleared)

---

## Troubleshooting

### Services Won't Start

**Check logs**:
```bash
docker compose logs
docker compose logs radicale
docker compose logs web
```

**Common issues**:

1. **Missing .env file**
   ```bash
   cp .env.example .env
   # Edit .env with your tokens
   ```

2. **Port already in use**
   ```bash
   sudo lsof -i :5232  # Check if port in use
   sudo lsof -i :3000
   ```

3. **Volume permission issues**
   ```bash
   # Docker manages volumes automatically, but if you have permission issues:
   # Remove and recreate volumes
   docker volume rm radicale-idp_radicale_collections radicale-idp_radicale_data radicale-idp_web_data
   docker compose up -d
   ```

### Connection Refused

**Verify services running**:
```bash
docker compose ps

# All services should show "Up"
```

**Check if ports are listening**:
```bash
sudo netstat -tlnp | grep 5232
sudo netstat -tlnp | grep 3000
```

**Test local connection**:
```bash
curl http://localhost:5232/
curl http://localhost:3000/web
```

### Privacy API Authentication Failed

**Verify RADICALE_TOKEN is set**:
```bash
docker compose exec radicale env | grep RADICALE_TOKEN
```

**Test API with token**:
```bash
curl -H "Authorization: Bearer $RADICALE_TOKEN" \
  http://localhost:5232/privacy/settings/testuser
```

**Expected response**:
- 200: Settings found
- 404: User has no settings yet (normal)
- 401: Token invalid (check RADICALE_TOKEN)

### Database Issues

**Check if databases exist**:
```bash
docker compose exec radicale ls -la /var/lib/radicale/
docker compose exec web ls -la /data/
```

**Initialize web database**:
```bash
./scripts/init-web-db.sh
```

**Reset databases** (careful - removes all data):
```bash
docker compose down -v
docker compose up -d
```

### SSL/TLS Certificate Issues

**Check SSL mode configuration**:
```bash
# View current SSL mode
grep SELF_SIGNED_SSL .env

# Run health check (includes SSL validation)
./scripts/health-check.sh
```

**Nginx container won't start**:
```bash
# Check nginx logs
docker compose logs nginx

# Verify certificates exist
ls -la volumes/ssl/self-signed/  # For SELF_SIGNED_SSL=true
docker compose exec certbot ls -la /etc/letsencrypt/live/  # For SELF_SIGNED_SSL=false

# Restart certbot to regenerate certificates
docker compose restart certbot
docker compose logs -f certbot
```

**Certificate expired or invalid**:
```bash
# Check certificate expiration
openssl x509 -enddate -noout -in volumes/ssl/self-signed/fullchain.pem

# Force renewal (Let's Encrypt mode)
docker compose exec certbot certbot renew --force-renewal
docker compose restart nginx

# Regenerate (self-signed mode)
rm volumes/ssl/self-signed/*.pem
docker compose restart certbot
docker compose restart nginx
```

**Let's Encrypt acquisition failed**:
See the detailed troubleshooting section in "Reverse Proxy & SSL" → "Troubleshooting SSL"

### Performance Issues

**Check resource usage**:
```bash
docker stats

# Shows CPU, memory, network I/O per container
```

**Check disk space**:
```bash
# Overall disk usage
df -h

# Docker volumes usage
du -sh /var/lib/docker/volumes/*

# View all volumes
docker volume ls
docker volume inspect radicale-idp_radicale_collections
```

**Optimize database**:
```bash
docker compose exec radicale sqlite3 /var/lib/radicale/privacy.db "VACUUM;"
docker compose exec web sqlite3 /data/local.db "VACUUM;"
```

---

## Quick Reference

### Essential Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Check status
docker compose ps

# View logs
docker compose logs -f

# Run backup
./scripts/backup.sh

# Run health check
./scripts/health-check.sh

# Execute command in container
docker compose exec radicale <command>
docker compose exec web <command>
```

### Important Paths

**On Server (Host)**:
- Project directory: `/opt/radicale-idp/`
- Configuration: `/opt/radicale-idp/.env`
- SSL certificates (self-signed): `volumes/ssl/self-signed/`
- SSL certificates (Let's Encrypt): `volumes/certbot/conf/live/${DOMAIN}/`
- Nginx config: `volumes/nginx/conf.d/`
- Backups: `/backup/radicale-idp/`
- Docker volumes: Managed automatically (use `docker volume ls` to see)

**Inside Containers** (for reference):
- Radicale data: `/var/lib/radicale/`
- Web app data: `/data/`
- Nginx SSL (self-signed): `/etc/ssl/self-signed/`
- Nginx SSL (Let's Encrypt): `/etc/letsencrypt/live/${DOMAIN}/`

**Docker Volume Names**:
```bash
# List volumes
docker volume ls

# View volume details
docker volume inspect radicale-idp_radicale_collections
docker volume inspect radicale-idp_radicale_data
docker volume inspect radicale-idp_web_data
```

### Port Reference

| Service | Port | Access | Notes |
|---------|------|--------|-------|
| Radicale | 5232 | localhost only | Exposed on 127.0.0.1:5232 |
| Web App | 3000 | localhost only | Exposed on 127.0.0.1:3000 |
| Nginx (HTTP) | 80 | public | Docker container, exposed on all interfaces |
| Nginx (HTTPS) | 443 | public | Docker container, exposed on all interfaces |
| Certbot | - | internal | Background service, no exposed ports |

### API Endpoints

```
GET    /privacy/settings/{user}           # Get user's settings
POST   /privacy/settings/{user}           # Create settings
PUT    /privacy/settings/{user}           # Update settings
DELETE /privacy/settings/{user}           # Delete settings
GET    /privacy/cards/{user}              # Find vCards with user info
POST   /privacy/cards/{user}/reprocess    # Reprocess vCards
```

### Environment Variables Quick Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| RADICALE_TOKEN | Privacy API auth | 64-char hex string |
| JWT_SECRET | Session signing | 64-char hex string |
| SELF_SIGNED_SSL | SSL mode | true (dev) / false (prod) |
| DOMAIN | Domain name (prod) | radicale.example.com |
| EMAIL | Let's Encrypt email | admin@example.com |
| AWS_ACCESS_KEY_ID | OTP delivery | IAM key |
| AWS_SECRET_ACCESS_KEY | OTP delivery | IAM secret |
| MOCK_EMAIL | Dev OTP | true/false |
| MOCK_SMS | Dev OTP | true/false |
| RADICALE_AUTH_TYPE | Server auth | none/htpasswd |

---

**Created**: 2024
**Updated**: 2025-11-27
**Status**: Production-ready

For additional help:
- Check service logs: `docker compose logs`
- SSL documentation: `nginx/ssl/README.md`
- Health check: `./scripts/health-check.sh`
- Archive documentation: `docs/archive/` (legacy information)
