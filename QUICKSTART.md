# Quick Start Guide - Radicale-IDP Docker Deployment

Get your Radicale-IDP server running in minutes!

## 5-Minute Setup

### Prerequisites
- SSH access to a Linux server
- Docker and Docker Compose installed

### Step 1: Clone Repository
```bash
ssh user@your-server.com
mkdir -p /opt/radicale-idp
cd /opt/radicale-idp
git clone https://github.com/your-org/radicale-idp.git .
```

### Step 2: Configure Environment
```bash
cp .env.example .env
nano .env

# Set at minimum:
# RADICALE_TOKEN=<strong-random-token>
# JWT_SECRET=<strong-random-token>
```

Generate random tokens:
```bash
openssl rand -hex 32
```

### Step 3: Start Services
```bash
# For local testing
docker-compose up -d

# For production (with persistent volumes)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Step 4: Verify
```bash
# Check status
docker-compose ps

# Run health check
./scripts/health-check.sh

# View logs
docker-compose logs -f
```

### Step 5: Access

**For SSH-only access:**
```bash
# On your local machine, create port forward
ssh -L 5232:localhost:5232 -L 3000:localhost:3000 user@your-server.com
```

Then open:
- Radicale: http://localhost:5232/
- Web App: http://localhost:3000/web

**For public access (with Nginx):**
See [DEPLOYMENT.md](DEPLOYMENT.md) for reverse proxy setup.

## That's It!

Your Radicale-IDP server is now running with:
- CalDAV/CardDAV server on port 5232
- Web app for privacy settings on port 3000
- Persistent data in Docker volumes

## Common Next Steps

### Initialize Database
```bash
./scripts/init-web-db.sh
```

### Create First Backup
```bash
./scripts/backup.sh
```

### Set Up HTTPS/SSL
Follow the [DEPLOYMENT.md](DEPLOYMENT.md) guide section on SSL/TLS setup.

### Configure Authentication
Edit `config/radicale.config` to change from `auth = none` to `auth = htpasswd` for production.

## Useful Commands

```bash
# View logs
docker-compose logs -f radicale    # Radicale logs
docker-compose logs -f web         # Web app logs

# Execute commands in containers
docker-compose exec radicale bash              # Radicale shell
docker-compose exec web npm run db:migrate    # Web database migration

# Backup data
./scripts/backup.sh

# Health check
./scripts/health-check.sh

# Stop services
docker-compose down

# Restart services
docker-compose restart
```

## Need More Help?

- **Installation issues?** → See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Docker help?** → [DOCKERFILE_NOTES.md](DOCKERFILE_NOTES.md)
- **Privacy API?** → [DOCS_PRIVACY.md](DOCS_PRIVACY.md)
- **Scripts?** → [scripts/README.md](scripts/README.md)

## Troubleshooting Quick Fixes

### Services won't start
```bash
# Check logs
docker-compose logs

# Make sure .env exists
ls -l .env
```

### Can't access services
```bash
# Verify they're running
docker-compose ps

# Check port forwarding is active
ssh -L 5232:localhost:5232 user@your-server.com
```

### Database errors
```bash
# Initialize web database
./scripts/init-web-db.sh

# Check database status
docker-compose exec web ls -la /data/local.db
```

## Security Notes

⚠️ **Before production:**
1. Change `RADICALE_TOKEN` to a secure random value
2. Change `JWT_SECRET` to a secure random value
3. Set up SSL/HTTPS (see DEPLOYMENT.md)
4. Change authentication from `none` to `htpasswd`
5. Set up regular backups (see scripts/backup.sh)

## Next: Full Documentation

For complete setup, production deployment, and maintenance, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [DOCKERFILE_NOTES.md](DOCKERFILE_NOTES.md) - Docker configuration
- [DOCS_PRIVACY.md](DOCS_PRIVACY.md) - Privacy features documentation
- [scripts/README.md](scripts/README.md) - Helper scripts guide
