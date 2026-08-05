#!/bin/bash
# Backup Radicale-IDP Docker volumes and data
#
# This script backs up:
# 1. Radicale data including collections and privacy database (radicale_data volume)
# 2. Web app database (web_data volume)
# 3. Configuration files
#
# Usage: ./scripts/backup.sh [backup_dir]
# Default backup dir: /backup/radicale-idp

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Detect container runtime (Docker or Podman)
if command -v docker &> /dev/null; then
    CONTAINER_RUNTIME="docker"
elif command -v podman &> /dev/null; then
    CONTAINER_RUNTIME="podman"
else
    echo "Error: Neither docker nor podman found in PATH"
    exit 1
fi

# Detect compose command (always target the fork's compose-privacy.yml, not the
# upstream compose.yaml that Docker Compose would pick by default)
COMPOSE_FILE="$PROJECT_ROOT/compose-privacy.yml"
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose -f $COMPOSE_FILE"
elif [ "$CONTAINER_RUNTIME" = "docker" ] && docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose -f $COMPOSE_FILE"
elif [ "$CONTAINER_RUNTIME" = "podman" ] && command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose -f $COMPOSE_FILE"
else
    echo "Error: No compose command found"
    exit 1
fi

# Default backup directory
BACKUP_DIR="${1:-/backup/radicale-idp}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$DATE"

# Compose prefixes volume names with the project name (the project
# directory name, lowercased)
PROJECT_NAME="$(basename "$PROJECT_ROOT" | tr '[:upper:]' '[:lower:]')"

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
    log_info "Using container runtime: $CONTAINER_RUNTIME"
    log_info "Using compose command: $COMPOSE_CMD"

    if [ ! -f "$PROJECT_ROOT/compose-privacy.yml" ]; then
        log_error "compose-privacy.yml not found in $PROJECT_ROOT"
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

    # Backup Radicale data volume (collections, privacy database, cache)
    if $CONTAINER_RUNTIME volume ls | grep -q "${PROJECT_NAME}_radicale_data"; then
        log_info "Backing up Radicale data (collections, privacy database)..."
        $CONTAINER_RUNTIME run --rm \
            -v "${PROJECT_NAME}_radicale_data":/data:ro \
            -v "$BACKUP_PATH":/backup \
            alpine tar czf /backup/radicale-data-$DATE.tar.gz -C /data . 2>/dev/null || true

        if [ -f "$BACKUP_PATH/radicale-data-$DATE.tar.gz" ]; then
            log_info "  Radicale data backup: $(du -h "$BACKUP_PATH/radicale-data-$DATE.tar.gz" | cut -f1)"
        fi
    else
        log_warn "Volume ${PROJECT_NAME}_radicale_data not found, skipping"
    fi

    # Backup web data volume (SQLite database)
    if $CONTAINER_RUNTIME volume ls | grep -q "${PROJECT_NAME}_web_data"; then
        log_info "Backing up web app data..."
        $CONTAINER_RUNTIME run --rm \
            -v "${PROJECT_NAME}_web_data":/data:ro \
            -v "$BACKUP_PATH":/backup \
            alpine tar czf /backup/web-data-$DATE.tar.gz -C /data . 2>/dev/null || true

        if [ -f "$BACKUP_PATH/web-data-$DATE.tar.gz" ]; then
            log_info "  Web data backup: $(du -h "$BACKUP_PATH/web-data-$DATE.tar.gz" | cut -f1)"
        fi
    else
        log_warn "Volume ${PROJECT_NAME}_web_data not found, skipping"
    fi
}

# Backup configuration files
backup_config() {
    log_info "Backing up configuration files..."

    cd "$PROJECT_ROOT"

    # Backup compose file
    cp compose-privacy.yml "$BACKUP_PATH/compose-privacy.yml" 2>/dev/null || log_warn "compose-privacy.yml not found"

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
- compose-privacy.yml: Compose configuration
- config-$DATE.tar.gz: Configuration files (radicale.config, nginx.conf, etc)
- radicale-data-$DATE.tar.gz: Collections, vCards, calendars, and privacy database
- web-data-$DATE.tar.gz: Web app database
- .env.backup: Environment variables (SECURE - Do not commit!)

To restore from backup:
1. Stop services: docker compose -f compose-privacy.yml down
2. Remove volumes: docker volume rm ${PROJECT_NAME}_radicale_data ${PROJECT_NAME}_web_data
3. Extract volumes:
   - docker run --rm -v ${PROJECT_NAME}_radicale_data:/data -v .:/backup alpine tar xzf /backup/radicale-data-*.tar.gz -C /data
   - docker run --rm -v ${PROJECT_NAME}_web_data:/data -v .:/backup alpine tar xzf /backup/web-data-*.tar.gz -C /data
4. Start services: docker compose -f compose-privacy.yml up -d
EOF
}

# Backup databases (SQL dumps)
backup_databases() {
    log_info "Creating SQL dumps of databases..."

    cd "$PROJECT_ROOT"

    # Dump privacy database
    if $COMPOSE_CMD ps radicale | grep -q "running"; then
        log_info "  Dumping privacy database..."
        $COMPOSE_CMD exec radicale sqlite3 /var/lib/radicale/privacy.db ".dump" > "$BACKUP_PATH/privacy-db-$DATE.sql" 2>/dev/null || log_warn "Failed to dump privacy database"
    fi

    # Dump web database
    if $COMPOSE_CMD ps web | grep -q "running"; then
        log_info "  Dumping web app database..."
        $COMPOSE_CMD exec web sqlite3 /data/local.db ".dump" > "$BACKUP_PATH/web-db-$DATE.sql" 2>/dev/null || log_warn "Failed to dump web database"
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
