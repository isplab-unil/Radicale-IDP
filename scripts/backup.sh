#!/bin/bash
# Backup Radicale-IDP Docker volumes and data
#
# This script backs up:
# 1. CalDAV/CardDAV collections (radicale_collections volume)
# 2. Radicale data including privacy database (radicale_data volume)
# 3. Web app database (web_data volume)
# 4. Configuration files
#
# Usage: ./scripts/backup.sh [backup_dir]
# Default backup dir: /backup/radicale-idp

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default backup directory
BACKUP_DIR="${1:-/backup/radicale-idp}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$DATE"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose is not installed"
        exit 1
    fi

    if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        log_error "docker-compose.yml not found in $PROJECT_ROOT"
        exit 1
    fi
}

# Create backup directory
create_backup_dir() {
    log_info "Creating backup directory: $BACKUP_PATH"
    mkdir -p "$BACKUP_PATH"

    if [ ! -d "$BACKUP_PATH" ]; then
        log_error "Failed to create backup directory"
        exit 1
    fi
}

# Backup Docker volumes
backup_volumes() {
    log_info "Backing up Docker volumes..."

    cd "$PROJECT_ROOT"

    # Get volume names from docker-compose
    VOLUMES=$(docker-compose config --resolve-image-digests 2>/dev/null | grep -E "^\s+[a-z_]+:" | sed 's/.*\([a-z_]*\):.*/\1/' || echo "")

    # Backup collections volume
    if docker volume ls | grep -q "radicale.*collections"; then
        log_info "Backing up CalDAV/CardDAV collections..."
        docker run --rm \
            -v radicale-idp_radicale_collections:/collections:ro \
            -v "$BACKUP_PATH":/backup \
            alpine tar czf /backup/collections-$DATE.tar.gz -C /collections . 2>/dev/null || true

        if [ -f "$BACKUP_PATH/collections-$DATE.tar.gz" ]; then
            log_info "  Collections backup: $(du -h "$BACKUP_PATH/collections-$DATE.tar.gz" | cut -f1)"
        fi
    fi

    # Backup Radicale data volume (privacy database, cache)
    if docker volume ls | grep -q "radicale.*data"; then
        log_info "Backing up Radicale data (privacy database)..."
        docker run --rm \
            -v radicale-idp_radicale_data:/data:ro \
            -v "$BACKUP_PATH":/backup \
            alpine tar czf /backup/radicale-data-$DATE.tar.gz -C /data . 2>/dev/null || true

        if [ -f "$BACKUP_PATH/radicale-data-$DATE.tar.gz" ]; then
            log_info "  Radicale data backup: $(du -h "$BACKUP_PATH/radicale-data-$DATE.tar.gz" | cut -f1)"
        fi
    fi

    # Backup web data volume (SQLite database)
    if docker volume ls | grep -q "web_data"; then
        log_info "Backing up web app data..."
        docker run --rm \
            -v radicale-idp_web_data:/data:ro \
            -v "$BACKUP_PATH":/backup \
            alpine tar czf /backup/web-data-$DATE.tar.gz -C /data . 2>/dev/null || true

        if [ -f "$BACKUP_PATH/web-data-$DATE.tar.gz" ]; then
            log_info "  Web data backup: $(du -h "$BACKUP_PATH/web-data-$DATE.tar.gz" | cut -f1)"
        fi
    fi
}

# Backup configuration files
backup_config() {
    log_info "Backing up configuration files..."

    cd "$PROJECT_ROOT"

    # Backup docker-compose files
    cp docker-compose.yml "$BACKUP_PATH/docker-compose.yml" 2>/dev/null || log_warn "docker-compose.yml not found"
    cp docker-compose.prod.yml "$BACKUP_PATH/docker-compose.prod.yml" 2>/dev/null || log_warn "docker-compose.prod.yml not found"

    # Backup configuration
    if [ -d "config" ]; then
        tar czf "$BACKUP_PATH/config-$DATE.tar.gz" config/ 2>/dev/null || true
        log_info "  Configuration backup: $(du -h "$BACKUP_PATH/config-$DATE.tar.gz" | cut -f1)"
    fi

    # Backup .env file (SECURELY!)
    if [ -f ".env" ]; then
        cp .env "$BACKUP_PATH/.env.backup"
        chmod 600 "$BACKUP_PATH/.env.backup"
        log_info "  Environment file backed up (secure)"
    fi

    # Create backup info file
    cat > "$BACKUP_PATH/BACKUP_INFO.txt" << EOF
Radicale-IDP Backup Information
================================
Created: $(date)
Location: $BACKUP_PATH
Project: $PROJECT_ROOT

Files included:
- docker-compose.yml: Compose configuration
- docker-compose.prod.yml: Production overrides
- config-$DATE.tar.gz: Configuration files (radicale.config, nginx.conf, etc)
- collections-$DATE.tar.gz: CalDAV/CardDAV collections
- radicale-data-$DATE.tar.gz: Radicale privacy database and cache
- web-data-$DATE.tar.gz: Web app database
- .env.backup: Environment variables (SECURE - Do not commit!)

To restore from backup:
1. Stop services: docker-compose down
2. Remove volumes: docker volume rm radicale-idp_radicale_collections radicale-idp_radicale_data radicale-idp_web_data
3. Extract volumes:
   - docker run --rm -v radicale-idp_radicale_collections:/collections -v .:/backup alpine tar xzf /backup/collections-*.tar.gz -C /collections
   - docker run --rm -v radicale-idp_radicale_data:/data -v .:/backup alpine tar xzf /backup/radicale-data-*.tar.gz -C /data
   - docker run --rm -v radicale-idp_web_data:/data -v .:/backup alpine tar xzf /backup/web-data-*.tar.gz -C /data
4. Start services: docker-compose up -d
EOF
}

# Backup databases (SQL dumps)
backup_databases() {
    log_info "Creating SQL dumps of databases..."

    cd "$PROJECT_ROOT"

    # Dump privacy database
    if docker-compose ps radicale | grep -q "running"; then
        log_info "  Dumping privacy database..."
        docker-compose exec radicale sqlite3 /var/lib/radicale/privacy.db ".dump" > "$BACKUP_PATH/privacy-db-$DATE.sql" 2>/dev/null || log_warn "Failed to dump privacy database"
    fi

    # Dump web database
    if docker-compose ps web | grep -q "running"; then
        log_info "  Dumping web app database..."
        docker-compose exec web sqlite3 /data/local.db ".dump" > "$BACKUP_PATH/web-db-$DATE.sql" 2>/dev/null || log_warn "Failed to dump web database"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    RETENTION_DAYS="${RETENTION_DAYS:-7}"  # Keep 7 days by default

    log_info "Cleaning up backups older than $RETENTION_DAYS days..."

    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +"$RETENTION_DAYS" -exec rm -rf {} \; 2>/dev/null || true
        log_info "  Old backups removed"
    fi
}

# Generate summary
generate_summary() {
    log_info "Backup Summary"
    echo ""
    echo "Backup Path: $BACKUP_PATH"
    echo "Total Size: $(du -sh "$BACKUP_PATH" | cut -f1)"
    echo ""
    echo "Files:"
    ls -lh "$BACKUP_PATH" | tail -n +2 | awk '{printf "  %-30s %8s\n", $9, $5}'
    echo ""
}

# Main execution
main() {
    echo "=== Radicale-IDP Backup Script ==="
    echo ""

    check_prerequisites
    create_backup_dir
    backup_volumes
    backup_config
    backup_databases
    cleanup_old_backups
    generate_summary

    log_info "Backup completed successfully!"
    log_info "Backup location: $BACKUP_PATH"
}

# Run main function
main "$@"
