# Radicale-IDP Helper Scripts

This directory contains utility scripts for managing the Radicale-IDP Docker/Podman deployment.

## Container Runtime

The scripts auto-detect the container runtime: Docker if available, otherwise Podman. On the production server (Podman, no Docker), the scripts use `sudo podman compose` automatically when run as a non-root user, so that they see the root-owned containers. Run them with `sudo` consistently (see `docs_privacy/DEPLOYMENT_PRIVACY.md`).

## Scripts

### start.sh
Start (or restart) the whole stack, building images as needed.

**Usage:**
```bash
./scripts/start.sh              # build if needed, start services
./scripts/start.sh --no-cache   # force a full rebuild without build cache
```

**What it does:**
- Detects the container runtime (Docker or Podman with sudo)
- Verifies `.env` exists
- Builds images and starts all services (`up -d --build`)
- With `--no-cache`: rebuilds images from scratch first (slow — use after dependency changes)

**When to use:**
- First time setup (after configuring `.env`)
- Deploying updates
- Restarting the stack after a cleanup

**Note:** Database migrations (`db:push`) and default data seeding happen automatically inside the containers at startup — no separate init step is needed.

### cleanup.sh
Stop the stack and optionally remove images and data.

**Usage:**
```bash
./scripts/cleanup.sh                  # stop and remove containers only (data preserved)
./scripts/cleanup.sh --rmi            # also remove locally built images
./scripts/cleanup.sh --volumes        # also remove volumes (DELETES ALL DATA)
```

**What it does:**
- Runs `compose down`, adding `--rmi local` and/or `-v` per the flags
- `--volumes` asks for an explicit `yes` confirmation — run `./scripts/backup.sh` first!

**When to use:**
- Before a fresh redeploy
- To reset the environment completely (`--rmi --volumes`)

### add-vcard-uids.sh
Ensure every vCard in `default-data/` has a UID property (CardDAV clients expect one).

**Usage:**
```bash
./scripts/add-vcard-uids.sh [default_data_dir]
```

**What it does:**
- Scans `<default-data>/<user>/<collection>/*.vcf`
- For cards without a UID, inserts `UID:<user subfolder><file name>` (alphanumeric characters only) after the `BEGIN:VCARD` line
- Cards that already have a UID are left untouched (idempotent)

**When to use:**
- After adding or editing vCards in `default-data/`, before seeding a fresh deployment

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
1. **Radicale Data** - radicale_data volume (collections, calendars, contacts, and privacy.db)
2. **Web App Data** - web_data volume (includes local.db)
3. **SQL Dumps** - Full SQL dumps of both databases
4. **Configuration** - compose-privacy.yml and Radicale config
5. **Environment** - .env file (backed up securely)

**Backup files:**
- `radicale-data-YYYYMMDD_HHMMSS.tar.gz` - Collections, calendar/contact data, and privacy database
- `web-data-YYYYMMDD_HHMMSS.tar.gz` - Web app database
- `privacy-db-YYYYMMDD_HHMMSS.sql` - SQL dump of privacy settings
- `web-db-YYYYMMDD_HHMMSS.sql` - SQL dump of web app database
- `config-YYYYMMDD_HHMMSS.tar.gz` - Configuration files
- `compose-privacy.yml` - Current compose config
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
- Containers (radicale, web, nginx, certbot) are running
- Services are responding to HTTP requests
- Databases are accessible
- Container volumes are mounted correctly
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
0 3 0 * * docker compose -f compose-privacy.yml exec radicale sqlite3 /var/lib/radicale/privacy.db "VACUUM;" && docker compose -f compose-privacy.yml exec web sqlite3 /data/local.db "VACUUM;"
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

# 2. Start services (builds images, runs migrations and seeding automatically)
echo "Starting services..."
./scripts/start.sh

# 3. Wait for services to be ready
echo "Waiting for services..."
sleep 10

# 4. Run health checks
echo "Running health checks..."
./scripts/health-check.sh

# 5. Create first backup
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
docker compose -f compose-privacy.yml logs

# Reset volumes (WARNING: deletes data! run ./scripts/backup.sh first)
./scripts/cleanup.sh --volumes
./scripts/start.sh
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
docker compose -f compose-privacy.yml exec radicale sqlite3 /var/lib/radicale/privacy.db "VACUUM;"
docker compose -f compose-privacy.yml exec web sqlite3 /data/local.db "VACUUM;"

# Clean up old backups manually
find /backup/radicale-idp -type d -mtime +7 -exec rm -rf {} \;
```

## Support

For issues with these scripts:
1. Run `./scripts/health-check.sh` to diagnose problems
2. Check the logs: `docker compose -f compose-privacy.yml logs`
3. Review the [DEPLOYMENT.md](../DEPLOYMENT.md) guide
4. Consult the [DOCS_PRIVACY.md](../DOCS_PRIVACY.md) documentation
