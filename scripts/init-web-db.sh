#!/bin/bash
# Initialize web application database
# This script runs database migrations for the React web app
#
# Usage: ./scripts/init-web-db.sh

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Initializing Web Application Database ==="
echo ""

# Detect container runtime (Docker or Podman).
# On the production server (Podman, no Docker), containers run under
# root: use sudo so rootless invocations don't miss them.
if command -v docker &> /dev/null; then
    CONTAINER_RUNTIME="docker"
elif command -v podman &> /dev/null; then
    if [ "$(id -u)" -ne 0 ] && command -v sudo &> /dev/null; then
        CONTAINER_RUNTIME="sudo podman"
    else
        CONTAINER_RUNTIME="podman"
    fi
else
    echo "Error: Neither docker nor podman found in PATH"
    exit 1
fi

# Detect compose command (always target compose-privacy.yml)
COMPOSE_FILE="$PROJECT_ROOT/compose-privacy.yml"
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose -f $COMPOSE_FILE"
elif [ "$CONTAINER_RUNTIME" = "docker" ] && docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose -f $COMPOSE_FILE"
elif $CONTAINER_RUNTIME compose version &> /dev/null; then
    COMPOSE_CMD="$CONTAINER_RUNTIME compose -f $COMPOSE_FILE"
elif command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose -f $COMPOSE_FILE"
else
    echo "Error: No compose command found"
    exit 1
fi

echo "Using container runtime: $CONTAINER_RUNTIME"
echo "Using compose command: $COMPOSE_CMD"

# Change to project directory
cd "$PROJECT_ROOT"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Check if compose-privacy.yml exists
if [ ! -f "compose-privacy.yml" ]; then
    echo "Error: compose-privacy.yml not found"
    exit 1
fi

echo "Checking if web service is running..."
if ! $COMPOSE_CMD ps web | grep -q "running"; then
    echo "Warning: Web service is not running. Starting services..."
    $COMPOSE_CMD up -d

    # Wait for services to be ready
    echo "Waiting for services to become healthy..."
    sleep 15
fi

echo "Running database migrations..."
if ! $COMPOSE_CMD exec web npm run db:migrate; then
    echo "Error: Database migration failed"
    exit 1
fi

echo ""
echo "=== Database Initialization Complete ==="
echo ""
echo "Verifying database..."
if $COMPOSE_CMD exec web test -f /data/local.db; then
    echo "✓ Database file created: /data/local.db"
    $COMPOSE_CMD exec web ls -lh /data/local.db
else
    echo "✗ Database file not found"
    exit 1
fi

echo ""
echo "To verify the database schema:"
echo "  $COMPOSE_CMD exec web sqlite3 /data/local.db \".tables\""
echo ""
echo "To view database info:"
echo "  $COMPOSE_CMD exec web sqlite3 /data/local.db \".schema\""
