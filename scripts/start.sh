#!/bin/bash
# Start (or restart) the Radicale-IDP stack
#
# Builds the images if needed and starts all services via compose.
# Database migrations and default data seeding happen automatically
# inside the containers at startup.
#
# Usage: ./scripts/start.sh [--no-cache]
#   --no-cache   Force a full rebuild of the images without build cache

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

cd "$PROJECT_ROOT"

echo "=== Starting Radicale-IDP ==="
echo "Using container runtime: $CONTAINER_RUNTIME"
echo "Using compose command: $COMPOSE_CMD"
echo ""

if [ ! -f ".env" ]; then
    echo "Error: .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

BUILD_ARGS="--build"
if [ "$1" = "--no-cache" ]; then
    echo "Rebuilding images without cache..."
    $COMPOSE_CMD build --no-cache
    BUILD_ARGS=""
fi

echo "Starting services..."
$COMPOSE_CMD up -d $BUILD_ARGS

echo ""
echo "=== Services started ==="
$COMPOSE_CMD ps

echo ""
echo "Run ./scripts/health-check.sh to verify all services are healthy."
