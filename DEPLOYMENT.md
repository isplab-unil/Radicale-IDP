# Radicale-IDP Docker Deployment Guide

Complete deployment guide for the Radicale-IDP (Radicale with Privacy Extensions) project on a server accessible via SSH only.

**Table of Contents**
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Pre-Deployment Setup](#pre-deployment-setup)
4. [Deploying Docker](#deploying-docker)
5. [Configuring Reverse Proxy](#configuring-reverse-proxy)
6. [SSL/TLS Setup](#ssltls-setup)
7. [Accessing via SSH](#accessing-via-ssh)
8. [Database Initialization](#database-initialization)
9. [Backup & Maintenance](#backup--maintenance)
10. [Troubleshooting](#troubleshooting)

## Overview

This deployment uses Docker Compose to run:
- **Radicale Server** - CalDAV/CardDAV server with privacy extensions
- **Web Application** - React-based UI for privacy settings management
- **Nginx** (optional) - Reverse proxy for public-facing access

Both services are containerized and use persistent Docker volumes for data storage.

## Prerequisites

### Server Requirements
- Linux server (Ubuntu 20.04+, Debian 11+, or similar)
- SSH access with sudo privileges
- Minimum 2GB RAM
- Minimum 10GB free disk space
- Docker 20.10+ and Docker Compose 2.0+

### Local Requirements (for initial setup)
- SSH client on your machine
- Basic familiarity with Linux terminal commands
- Text editor for configuration files

### Before Starting
Determine:
1. Your server's domain name or IP address
2. AWS SES/SNS credentials (if not using mock mode)
3. A strong random token for `RADICALE_TOKEN` (generate: `openssl rand -hex 32`)
4. A strong random token for `JWT_SECRET` (generate: `openssl rand -hex 32`)

## Pre-Deployment Setup

### Step 1: Connect to Your Server

```bash
ssh user@your-server.com
```

Replace `user` and `your-server.com` with your actual SSH credentials.

### Step 2: Install Docker and Docker Compose

If Docker is not already installed:

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (restart SSH after this)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

### Step 3: Create Deployment Directory

```bash
# Create a dedicated directory for deployment
mkdir -p /opt/radicale-idp
cd /opt/radicale-idp

# Clone or copy your repository
git clone https://github.com/your-org/radicale-idp.git .
```

### Step 4: Create Environment File

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
nano .env
```

**Critical fields to set:**

```ini
# Generate with: openssl rand -hex 32
RADICALE_TOKEN=your-strong-random-token-here

# Generate with: openssl rand -hex 32
JWT_SECRET=your-strong-jwt-secret-here

# AWS SES/SNS Configuration (if not using mock mode)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
EMAIL_FROM=noreply@your-domain.com
EMAIL_FROM_NAME=Radicale IDP
```

**Important:** Keep `.env` secure:

```bash
chmod 600 .env
```

### Step 5: Create Persistent Storage Directories (for Production)

For production deployments using the `docker-compose.prod.yml` override:

```bash
# Create directories for persistent volumes
sudo mkdir -p /mnt/radicale/collections
sudo mkdir -p /mnt/radicale/data
sudo mkdir -p /mnt/web/data

# Set proper permissions (Docker container runs as UID 1000)
sudo chown 1000:1000 /mnt/radicale/collections
sudo chown 1000:1000 /mnt/radicale/data
sudo chown 1000:1000 /mnt/web/data

sudo chmod 755 /mnt/radicale/collections
sudo chmod 755 /mnt/radicale/data
sudo chmod 755 /mnt/web/data
```

## Deploying Docker

### Option A: Quick Start (Development)

For testing with local Docker volumes:

```bash
cd /opt/radicale-idp

# Build and start services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

The services will be available at:
- Radicale: `http://localhost:5232/`
- Web App: `http://localhost:3000/`

**Note:** These are bound to `127.0.0.1` on your server. See [Accessing via SSH](#accessing-via-ssh) for remote access.

### Option B: Production Deployment

For a production setup with persistent storage:

```bash
cd /opt/radicale-idp

# Build and start with production overrides
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### Verify Deployment

Check that both services are running and healthy:

```bash
# Check container status
docker ps | grep radicale

# Check Radicale health
curl http://127.0.0.1:5232/

# Check web app health
curl http://127.0.0.1:3000/web

# View service logs
docker-compose logs radicale
docker-compose logs web
```

### Database Initialization

The databases initialize automatically on first run, but the web app database may need migration:

```bash
# Initialize web app database (if migration is required)
docker-compose exec web npm run db:migrate

# Verify database creation
docker volume ls | grep radicale
docker volume ls | grep web_data
```

## Configuring Reverse Proxy

For public-facing access with HTTPS, you need a reverse proxy.

### Option 1: Using Nginx (Recommended)

#### Install Nginx

```bash
sudo apt-get install -y nginx

# Enable nginx to start on boot
sudo systemctl enable nginx
```

#### Configure Nginx

```bash
# Copy the provided nginx configuration
sudo cp config/nginx.conf /etc/nginx/sites-available/radicale-idp

# Edit the configuration (replace domain names)
sudo nano /etc/nginx/sites-available/radicale-idp
# Change "your-domain.com" to your actual domain

# Enable the site
sudo ln -s /etc/nginx/sites-available/radicale-idp /etc/nginx/sites-enabled/

# Disable default site if needed
sudo rm /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Option 2: Using Caddy (Easier SSL Management)

Caddy automatically handles Let's Encrypt certificates:

```bash
# Install Caddy
sudo apt-get install -y caddy

# Create Caddyfile
sudo nano /etc/caddy/Caddyfile
```

Add the configuration from `config/nginx.conf` (see Caddy section at the bottom).

## SSL/TLS Setup

### Using Let's Encrypt with Nginx

For automatic SSL certificate generation and renewal:

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test renewal (won't actually renew)
sudo certbot renew --dry-run

# Certificates auto-renew daily via systemd timer
```

Certbot will automatically:
1. Generate the SSL certificate
2. Update the Nginx config
3. Set up auto-renewal

### Using Let's Encrypt with Caddy

Caddy handles this automatically:

```bash
# Caddy automatically obtains and renews certificates
# No additional steps needed!

# Reload Caddy after config changes
sudo systemctl reload caddy
```

### Manual SSL Certificate Setup

If you have your own certificates:

```bash
# Copy certificates to /etc/ssl/
sudo cp /path/to/your-domain.com.crt /etc/ssl/certs/
sudo cp /path/to/your-domain.com.key /etc/ssl/private/

# Update Nginx config
sudo nano /etc/nginx/sites-available/radicale-idp
# Uncomment the SSL directives and update paths

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Accessing via SSH

Since your server is SSH-only, you can access the services through SSH tunneling:

### Port Forwarding (Simple)

Forward ports from your local machine to the server:

```bash
# Keep port forwarding active in background
ssh -N -L 5232:localhost:5232 -L 3000:localhost:3000 user@your-server.com &

# Now access locally
# Radicale: http://localhost:5232/
# Web app: http://localhost:3000/web
```

### For Reverse Proxy Access

If you've set up Nginx/Caddy on the server and want external access:

```bash
# Forward proxy port
ssh -N -L 80:localhost:80 -L 443:localhost:443 user@your-server.com &

# Access via your domain (if DNS is configured)
# http://your-domain.com/
# https://your-domain.com/
```

### Permanent SSH Tunnel (tmux)

Create a persistent tunnel using tmux:

```bash
# On your local machine:
tmux new-session -d -s radicale-tunnel \
  ssh -N -L 5232:localhost:5232 -L 3000:localhost:3000 user@your-server.com

# Check tunnel status
tmux list-sessions

# Kill tunnel when done
tmux kill-session -t radicale-tunnel
```

### Configure SSH for Easier Access

Add to your `~/.ssh/config`:

```
Host radicale-server
    HostName your-server.com
    User your-username
    LocalForward 5232 127.0.0.1:5232
    LocalForward 3000 127.0.0.1:3000
    # For Nginx proxy
    LocalForward 80 127.0.0.1:80
    LocalForward 443 127.0.0.1:443
```

Then simply:

```bash
ssh radicale-server
```

## Database Initialization

### Radicale Privacy Database

Creates automatically on first run. Verify:

```bash
docker-compose exec radicale ls -la /var/lib/radicale/privacy.db
```

### Web App Database

Initialize the database schema:

```bash
# Run migration
docker-compose exec web npm run db:migrate

# Verify database exists
docker-compose exec web ls -la /data/local.db
```

### Test Data

Generate test data for development:

```bash
# Generate test VCF files
docker-compose exec radicale python3 tests/data/privacy/generate_vcf_data.py

# Generate test privacy settings
docker-compose exec radicale python3 tests/data/privacy/generate_privacy_settings_json.py
```

## Backup & Maintenance

### Backup Strategy

Three critical data sources need regular backups:

```bash
#!/bin/bash
# backup-radicale.sh - Complete backup script

BACKUP_DIR="/backup/radicale-idp"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR/$DATE"

# Backup collections
docker run --rm \
  -v radicale-idp_radicale_collections:/collections \
  -v "$BACKUP_DIR/$DATE":/backup \
  alpine tar czf /backup/collections.tar.gz -C /collections .

# Backup Radicale privacy database
docker run --rm \
  -v radicale-idp_radicale_data:/data \
  -v "$BACKUP_DIR/$DATE":/backup \
  alpine tar czf /backup/radicale-data.tar.gz -C /data .

# Backup web app database
docker run --rm \
  -v radicale-idp_web_data:/data \
  -v "$BACKUP_DIR/$DATE":/backup \
  alpine tar czf /backup/web-data.tar.gz -C /data .

# Backup environment file (securely)
cp /opt/radicale-idp/.env "$BACKUP_DIR/$DATE/.env.backup"
chmod 600 "$BACKUP_DIR/$DATE/.env.backup"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

echo "Backup completed: $BACKUP_DIR/$DATE"
```

Set up automatic backups:

```bash
# Copy script
sudo cp scripts/backup.sh /usr/local/bin/radicale-backup
sudo chmod +x /usr/local/bin/radicale-backup

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/radicale-backup
```

### Container Maintenance

```bash
# View logs
docker-compose logs -f --tail=100

# Check disk usage
docker system df

# Remove unused images/containers
docker system prune -a

# Update Docker images
docker-compose pull
docker-compose up -d
```

### Database Maintenance

```bash
# Vacuum SQLite database (optimize storage)
docker-compose exec radicale sqlite3 /var/lib/radicale/privacy.db "VACUUM;"
docker-compose exec web sqlite3 /data/local.db "VACUUM;"

# Backup databases
docker-compose exec radicale sqlite3 /var/lib/radicale/privacy.db ".dump" > privacy-backup.sql
docker-compose exec web sqlite3 /data/local.db ".dump" > web-backup.sql
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs radicale
docker-compose logs web

# Common issues:
# - Port already in use: sudo lsof -i :5232
# - Volume permission denied: sudo chown 1000:1000 /mnt/radicale/*
# - Missing .env file: cp .env.example .env
```

### Connection Refused

```bash
# Verify services are running
docker-compose ps

# Check if ports are listening
sudo netstat -tlnp | grep 5232
sudo netstat -tlnp | grep 3000

# Test local connection
curl http://localhost:5232/
curl http://localhost:3000/web
```

### Database Initialization Failed

```bash
# Check database exists
docker-compose exec radicale ls -la /var/lib/radicale/
docker-compose exec web ls -la /data/

# Reset database (careful - removes all data!)
docker-compose down -v  # Removes all volumes
docker-compose up -d
```

### Privacy API Not Working

```bash
# Verify RADICALE_TOKEN is set
docker-compose exec radicale env | grep RADICALE_TOKEN

# Test privacy API
curl -H "Authorization: Bearer your-token" \
  http://localhost:5232/privacy/settings/testuser

# Check Radicale logs
docker-compose logs radicale | grep privacy
```

### Nginx Configuration Issues

```bash
# Test Nginx config
sudo nginx -t

# View Nginx logs
sudo tail -f /var/log/nginx/radicale-idp-error.log
sudo tail -f /var/log/nginx/radicale-idp-access.log

# Check SSL certificate
sudo openssl x509 -in /etc/ssl/certs/your-domain.com.crt -text -noout
```

### Performance Issues

```bash
# Monitor resource usage
docker stats

# Check disk space
df -h
du -sh /var/lib/docker/volumes/*

# Optimize database
docker-compose exec radicale sqlite3 /var/lib/radicale/privacy.db "VACUUM;"
docker-compose exec web sqlite3 /data/local.db "VACUUM;"
```

## Additional Resources

- [Radicale Documentation](https://radicale.org/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt/Certbot](https://certbot.eff.org/)
- [CalDAV/CardDAV Standards](https://en.wikipedia.org/wiki/CalDAV)

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review service logs: `docker-compose logs`
3. Consult the [DOCS_PRIVACY.md](DOCS_PRIVACY.md) file
4. Open an issue on GitHub
