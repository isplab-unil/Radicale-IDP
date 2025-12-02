# Radicale-IDP Helper Scripts

This directory contains utility scripts for managing the Radicale-IDP Docker deployment.

## Scripts

### init-web-db.sh
Initialize the web application database with required schema.

**Usage:**
```bash
./scripts/init-web-db.sh
```

**What it does:**
- Verifies docker-compose is installed and configured
- Checks if services are running (starts them if needed)
- Runs database migrations: `npm run db:migrate`
- Verifies database file exists and is accessible

**When to use:**
- First time setup
- After resetting volumes
- If you see database-related errors in the web app

### backup.sh
Create comprehensive backups of all Radicale-IDP data.

**Usage:**
```bash
./scripts/backup.sh [backup_directory]
```

**Examples:**
```bash
# Use default backup directory (/backup/radicale-idp)
./scripts/backup.sh

# Use custom backup directory
./scripts/backup.sh /mnt/backup/radicale-idp

# Run as root (if needed for directory permissions)
sudo ./scripts/backup.sh /backup/radicale-idp
```

**What it backs up:**
1. **CalDAV/CardDAV Collections** - radicale_collections volume
2. **Radicale Data** - radicale_data volume (includes privacy.db)
3. **Web App Data** - web_data volume (includes local.db)
4. **SQL Dumps** - Full SQL dumps of both databases
5. **Configuration** - docker-compose files and Radicale config
6. **Environment** - .env file (backed up securely)

**Backup files:**
- `collections-YYYYMMDD_HHMMSS.tar.gz` - All calendar/contact data
- `radicale-data-YYYYMMDD_HHMMSS.tar.gz` - Privacy database and cache
- `web-data-YYYYMMDD_HHMMSS.tar.gz` - Web app database
- `privacy-db-YYYYMMDD_HHMMSS.sql` - SQL dump of privacy settings
- `web-db-YYYYMMDD_HHMMSS.sql` - SQL dump of web app database
- `config-YYYYMMDD_HHMMSS.tar.gz` - Configuration files
- `docker-compose.yml`, `docker-compose.prod.yml` - Current compose config
- `.env.backup` - Environment variables (secure, 600 permissions)
- `BACKUP_INFO.txt` - Backup metadata and restore instructions

**Automatic cleanup:**
- Backups older than 7 days are automatically deleted
- Change retention by setting `RETENTION_DAYS` environment variable:
  ```bash
  RETENTION_DAYS=30 ./scripts/backup.sh
  ```

**Schedule regular backups:**
```bash
# Add to crontab (daily at 2 AM)
sudo crontab -e

# Add this line:
0 2 * * * /path/to/radicale-idp/scripts/backup.sh
```

### health-check.sh
Monitor the health and status of all services.

**Usage:**
```bash
./scripts/health-check.sh
```

**What it checks:**
- Docker and docker-compose are installed
- Both containers (radicale and web) are running
- Services are responding to HTTP requests
- Databases are accessible
- Docker volumes are mounted correctly
- Configuration files exist
- Environment variables are set
- Container resource usage

**Output:**
- Detailed status of all checks
- Container information
- Database statistics
- Resource usage
- Logs if any checks fail

**When to use:**
- Before deploying
- For troubleshooting issues
- As part of monitoring/health checks
- To verify configuration changes

## Cron Scheduling

### Daily backup at 2 AM
```bash
sudo crontab -e

# Add:
0 2 * * * cd /opt/radicale-idp && /opt/radicale-idp/scripts/backup.sh >> /var/log/radicale-backup.log 2>&1
```

### Hourly health checks
```bash
# Add:
0 * * * * /opt/radicale-idp/scripts/health-check.sh >> /var/log/radicale-health.log 2>&1
```

### Weekly optimization
```bash
# Add:
0 3 0 * * docker-compose exec radicale sqlite3 /var/lib/radicale/privacy.db "VACUUM;" && docker-compose exec web sqlite3 /data/local.db "VACUUM;"
```

## Example: Complete Setup Script

```bash
#!/bin/bash
# setup-radicale.sh - Complete deployment setup

set -e
cd /opt/radicale-idp

echo "=== Radicale-IDP Setup ==="

# 1. Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Please edit .env with your settings:"
    nano .env
    exit 1
fi

# 2. Start services
echo "Starting services..."
docker-compose up -d

# 3. Wait for services to be ready
echo "Waiting for services..."
sleep 10

# 4. Initialize web database
echo "Initializing web database..."
./scripts/init-web-db.sh

# 5. Run health checks
echo "Running health checks..."
./scripts/health-check.sh

# 6. Create first backup
echo "Creating initial backup..."
./scripts/backup.sh

echo ""
echo "=== Setup Complete ==="
echo "Services are running at:"
echo "  - Radicale: http://localhost:5232/"
echo "  - Web App: http://localhost:3000/web"
```

## Troubleshooting Scripts

### If services won't start
```bash
# Check logs
docker-compose logs

# Reset volumes (WARNING: deletes data!)
docker-compose down -v
docker-compose up -d

# Reinitialize
./scripts/init-web-db.sh
```

### If database is corrupted
```bash
# Backup current data
./scripts/backup.sh /backup/corrupted

# Restore from recent backup
# See BACKUP_INFO.txt in the backup directory for restore instructions
```

### If disk space is low
```bash
# Check volume sizes
du -sh /var/lib/docker/volumes/*

# Optimize databases
docker-compose exec radicale sqlite3 /var/lib/radicale/privacy.db "VACUUM;"
docker-compose exec web sqlite3 /data/local.db "VACUUM;"

# Clean up old backups manually
find /backup/radicale-idp -type d -mtime +7 -exec rm -rf {} \;
```

## Support

For issues with these scripts:
1. Run `./scripts/health-check.sh` to diagnose problems
2. Check the logs: `docker-compose logs`
3. Review the [DEPLOYMENT.md](../DEPLOYMENT.md) guide
4. Consult the [DOCS_PRIVACY.md](../DOCS_PRIVACY.md) documentation
