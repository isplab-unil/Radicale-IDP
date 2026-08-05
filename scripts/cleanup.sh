#!/bin/bash
# Stop and clean up the Radicale-IDP stack
#
# By default, only stops and removes containers. Data is preserved.
#
# Usage: ./scripts/cleanup.sh [--rmi] [--volumes]
#   --rmi       Also remove the locally built images
#   --volumes   Also remove the named volumes (DELETES ALL DATA:
#               collections, calendars, contacts, and databases)

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

REMOVE_IMAGES=false
REMOVE_VOLUMES=false
for arg in "$@"; do
    case "$arg" in
        --rmi) REMOVE_IMAGES=true ;;
        --volumes) REMOVE_VOLUMES=true ;;
        *) echo "Unknown option: $arg"; echo "Usage: $0 [--rmi] [--volumes]"; exit 1 ;;
    esac
done

cd "$PROJECT_ROOT"

echo "=== Cleaning up Radicale-IDP ==="
echo "Using container runtime: $CONTAINER_RUNTIME"
echo "Using compose command: $COMPOSE_CMD"
echo ""

DOWN_ARGS=""
if [ "$REMOVE_VOLUMES" = true ]; then
    echo "WARNING: --volumes will DELETE ALL DATA (collections, calendars, contacts, databases)."
    echo "Make sure you have a recent backup (./scripts/backup.sh)."
    read -r -p "Type 'yes' to confirm: " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Aborted."
        exit 1
    fi
    DOWN_ARGS="$DOWN_ARGS -v"
fi

if [ "$REMOVE_IMAGES" = true ]; then
    DOWN_ARGS="$DOWN_ARGS --rmi local"
fi

echo "Stopping and removing containers..."
$COMPOSE_CMD down $DOWN_ARGS

echo ""
echo "=== Cleanup complete ==="
[ "$REMOVE_IMAGES" = true ] && echo "Local images removed."
[ "$REMOVE_VOLUMES" = true ] && echo "Volumes removed (all data deleted)."
echo "Run ./scripts/start.sh to start the stack again."
