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
│                     Reverse Proxy (Nginx)                    │
│              [SSL/TLS termination, public access]            │
└────────────────────────┬────────────────────────────────────┘
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
     ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Radicale    │  │  Web App     │  │  Privacy API │
│  (port 5232) │  │  (port 3000) │  │  (built-in)  │
│              │  │              │  │              │
│ • CalDAV     │  │ • React UI   │  │ • Bearer     │
│ • CardDAV    │  │ • OTP Auth   │  │   token auth │
│              │  │ • DB queries │  │              │
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

- `docker-compose.yml` - Service orchestration
- `docker-compose.prod.yml` - Production overrides with persistent storage
- `Dockerfile.local` - Build Radicale from local source with privacy extensions
- `.env.example` - Environment variable template
- `config/radicale.config` - Radicale server configuration
- `scripts/backup.sh` - Automated backup tool
- `scripts/health-check.sh` - System monitoring
- `scripts/init-web-db.sh` - Database initialization

---

## Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu 20.04+, Debian 11+, or similar)
- **SSH Access**: Server accessible only via SSH with sudo privileges
- **Docker**: 20.10+ with Docker Compose 2.0+
- **Resources**: Minimum 2GB RAM, 10GB disk space
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
docker-compose --version  # Should be 2.0+
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

git clone https://github.com/your-org/radicale-idp.git .
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
docker-compose up -d
```

**For production**:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Docker automatically manages volume creation and permissions.

### Step 5: Verify Deployment

```bash
# Check services status
docker-compose ps

# Run health check
./scripts/health-check.sh

# View logs
docker-compose logs -f
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

## Environment Configuration

### Complete .env Reference

All configuration is managed through environment variables. Copy `.env.example` to `.env` and customize:

```ini
# ====== CRITICAL - Security Tokens ======
# Privacy API authentication token (32+ random characters)
RADICALE_TOKEN=<generate-with-openssl-rand-hex-32>

# Web app session signing (32+ random characters)
JWT_SECRET=<generate-with-openssl-rand-hex-32>

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
docker-compose up -d

# Services accessible at:
# - Radicale: http://localhost:5232/
# - Web app: http://localhost:3000/web

# View logs
docker-compose logs -f

# Stop services (keeps data)
docker-compose down

# Stop and remove data
docker-compose down -v
```

**Characteristics**:
- Fast startup
- Automatic volume management
- Data persists across container restarts
- Low resource overhead

### Option 2: Production Deployment

**Use case**: Live server, persistent data, backups

Identical to development, but with enhanced resource limits, logging, and health checks.

```bash
cd /opt/radicale-idp

# Start with production config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

**What the production override adds**:
- Enhanced resource allocation (2 CPU, 1GB RAM per container)
- More aggressive health checks
- Larger log rotation (50MB per file, keep 5 files)

**Characteristics**:
- Data persists across container restarts
- Docker-managed named volumes (automatic backup compatible)
- Better resource management
- Enterprise-grade logging
- Zero manual setup required

### Which Dockerfile to Use

Two options provided:

| | Dockerfile | Dockerfile.local |
|---|---|---|
| **Source** | Official Radicale from GitHub | Your local fork |
| **Privacy Extensions** | No | Yes (Recommended) |
| **Build Time** | Slower (downloads) | Faster |
| **Image Size** | Smaller (~150MB) | Larger (~200MB) |
| **Use Case** | Unmodified Radicale | This project |

**Recommendation**: Use `Dockerfile.local` to ensure privacy extensions are deployed.

**To use Dockerfile.local**, edit `docker-compose.yml`:

```yaml
services:
  radicale:
    build:
      context: .
      dockerfile: Dockerfile.local  # Change from 'Dockerfile'
```

Then rebuild:
```bash
docker-compose build --no-cache radicale
docker-compose up -d
```

---

## Reverse Proxy & SSL

For public access, you need a reverse proxy to handle HTTPS and route traffic to Docker containers bound to localhost.

### Nginx Reverse Proxy

#### Installation

```bash
sudo apt-get update
sudo apt-get install -y nginx

# Enable to start on boot
sudo systemctl enable nginx
```

#### Configuration

Example Nginx config for `/etc/nginx/sites-available/radicale-idp`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (added by Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Proxy to Radicale
    location / {
        proxy_pass http://127.0.0.1:5232;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebDAV support for CalDAV/CardDAV
        proxy_request_buffering off;
        proxy_buffering off;
    }

    # Proxy web app
    location /web {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Enable and Test

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/radicale-idp /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### SSL/TLS with Let's Encrypt

#### Automatic Setup with Certbot

```bash
# Install Certbot and Nginx plugin
sudo apt-get install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Automatic renewal (runs daily via systemd)
sudo certbot renew --dry-run
```

Certbot automatically:
1. Creates SSL certificates
2. Updates Nginx config
3. Sets up auto-renewal

#### Manual Certificate Setup

If you have existing certificates:

```bash
# Copy certificates
sudo cp /path/to/cert.crt /etc/ssl/certs/your-domain.com.crt
sudo cp /path/to/key.key /etc/ssl/private/your-domain.com.key

# Update permissions
sudo chmod 644 /etc/ssl/certs/your-domain.com.crt
sudo chmod 600 /etc/ssl/private/your-domain.com.key

# Update Nginx config with paths, then test and reload
```

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
docker-compose down

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
docker-compose up -d
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
docker-compose exec radicale sqlite3 /var/lib/radicale/privacy.db "VACUUM;"

# Web app database
docker-compose exec web sqlite3 /data/local.db "VACUUM;"
```

#### Backup Databases

```bash
# Privacy database
docker-compose exec radicale sqlite3 /var/lib/radicale/privacy.db ".dump" > privacy-backup.sql

# Web database
docker-compose exec web sqlite3 /data/local.db ".dump" > web-backup.sql
```

### Updating Containers

```bash
# Pull latest images
docker-compose pull

# Rebuild local image
docker-compose build --no-cache radicale

# Restart services
docker-compose up -d

# Verify update
docker-compose ps
docker-compose logs
```

### Viewing Logs

```bash
# Real-time logs
docker-compose logs -f

# Radicale logs only
docker-compose logs -f radicale

# Web app logs only
docker-compose logs -f web

# Last 100 lines of logs
docker-compose logs -f --tail=100

# Logs with timestamps
docker-compose logs -f -t
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
docker-compose down
docker-compose up -d
```

**Step 4**: Invalidate old tokens
- Update any API clients using old RADICALE_TOKEN
- Users will need to re-authenticate (web sessions cleared)

---

## Troubleshooting

### Services Won't Start

**Check logs**:
```bash
docker-compose logs
docker-compose logs radicale
docker-compose logs web
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
   docker-compose up -d
   ```

### Connection Refused

**Verify services running**:
```bash
docker-compose ps

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
docker-compose exec radicale env | grep RADICALE_TOKEN
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
docker-compose exec radicale ls -la /var/lib/radicale/
docker-compose exec web ls -la /data/
```

**Initialize web database**:
```bash
./scripts/init-web-db.sh
```

**Reset databases** (careful - removes all data):
```bash
docker-compose down -v
docker-compose up -d
```

### Nginx SSL Certificate Issues

**Test Nginx configuration**:
```bash
sudo nginx -t
```

**Check certificate validity**:
```bash
sudo openssl x509 -in /etc/ssl/certs/your-domain.com.crt -text -noout
```

**View Nginx error logs**:
```bash
sudo tail -f /var/log/nginx/radicale-idp-error.log
sudo tail -f /var/log/nginx/radicale-idp-access.log
```

### Performance Issues

**Check resource usage**:
```bash
docker stats

# Shows CPU, memory, network I/O per container
```

**Check disk space**:
```bash
df -h
du -sh /var/lib/docker/volumes/*
du -sh /mnt/radicale/*
du -sh /mnt/web/*
```

**Optimize database**:
```bash
docker-compose exec radicale sqlite3 /var/lib/radicale/privacy.db "VACUUM;"
docker-compose exec web sqlite3 /data/local.db "VACUUM;"
```

---

## Quick Reference

### Essential Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Run backup
./scripts/backup.sh

# Run health check
./scripts/health-check.sh

# Execute command in container
docker-compose exec radicale <command>
docker-compose exec web <command>
```

### Important Paths

**On Server**:
- Config: `/opt/radicale-idp/`
- Data: Docker-managed volumes (automatic, no manual paths)
- Backups: `/backup/radicale-idp/`
- Docker volumes: Use `docker volume ls` to view

**In Containers**:
- Radicale data: `/var/lib/radicale/`
- Web data: `/data/`

### Port Reference

| Service | Port | Access |
|---------|------|--------|
| Radicale | 5232 | localhost only |
| Web App | 3000 | localhost only |
| Nginx (HTTP) | 80 | public |
| Nginx (HTTPS) | 443 | public |

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
| AWS_ACCESS_KEY_ID | OTP delivery | IAM key |
| AWS_SECRET_ACCESS_KEY | OTP delivery | IAM secret |
| MOCK_EMAIL | Dev OTP | true/false |
| MOCK_SMS | Dev OTP | true/false |
| RADICALE_AUTH_TYPE | Server auth | none/htpasswd |

---

**Created**: 2024
**Updated**: 2025-11-24
**Status**: Production-ready

For additional help, check service logs: `docker-compose logs` or review individual documentation in the `docs/archive/` folder for detailed information on specific topics.
