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

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed"
    exit 1
fi

# Change to project directory
cd "$PROJECT_ROOT"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found"
    exit 1
fi

echo "Checking if web service is running..."
if ! docker-compose ps web | grep -q "running"; then
    echo "Warning: Web service is not running. Starting services..."
    docker-compose up -d

    # Wait for services to be ready
    echo "Waiting for services to become healthy..."
    sleep 15
fi

echo "Running database migrations..."
if ! docker-compose exec web npm run db:migrate; then
    echo "Error: Database migration failed"
    exit 1
fi

echo ""
echo "=== Database Initialization Complete ==="
echo ""
echo "Verifying database..."
if docker-compose exec web test -f /data/local.db; then
    echo "✓ Database file created: /data/local.db"
    docker-compose exec web ls -lh /data/local.db
else
    echo "✗ Database file not found"
    exit 1
fi

echo ""
echo "To verify the database schema:"
echo "  docker-compose exec web sqlite3 /data/local.db \".tables\""
echo ""
echo "To view database info:"
echo "  docker-compose exec web sqlite3 /data/local.db \".schema\""
