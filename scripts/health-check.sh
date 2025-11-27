#!/bin/bash
# Health check script for Radicale-IDP services
#
# Checks:
# - Both containers are running
# - Services are responding to requests
# - Databases are accessible
# - Docker volumes are mounted
#
# Usage: ./scripts/health-check.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Status tracking
CHECKS_PASSED=0
CHECKS_FAILED=0

# Functions
check() {
    local name="$1"
    local command="$2"

    printf "%-50s " "Checking $name..."

    if eval "$command" &>/dev/null; then
        echo -e "${GREEN}✓${NC}"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC}"
        ((CHECKS_FAILED++))
        return 1
    fi
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Main checks
main() {
    cd "$PROJECT_ROOT"

    echo "=== Radicale-IDP Health Check ==="
    echo ""

    set +e  # Disable exit on error for health checks

    # Docker availability
    check "Docker is installed" "command -v docker"
    check "docker compose is installed" "command -v docker-compose"

    echo ""
    echo "Container Status:"
    check "Radicale container is running" "docker compose ps radicale | grep -q Up"
    check "Web container is running" "docker compose ps web | grep -q Up"

    echo ""
    echo "Service Availability:"
    check "Radicale is responding" "curl -s http://127.0.0.1:5232/ >/dev/null"
    check "Web app is responding" "curl -s http://127.0.0.1:3000/web >/dev/null"

    echo ""
    echo "Database Accessibility:"
    check "Privacy database is accessible" "docker compose exec radicale test -f /var/lib/radicale/privacy.db"
    check "Web database is accessible" "docker compose exec web test -f /data/local.db"

    echo ""
    echo "Volume Status:"
    check "Collections volume exists" "docker volume ls | grep -q radicale_collections"
    check "Radicale data volume exists" "docker volume ls | grep -q radicale_data"
    check "Web data volume exists" "docker volume ls | grep -q web_data"

    echo ""
    echo "Configuration Files:"
    check "docker-compose.yml exists" "test -f docker-compose.yml"
    check ".env file exists" "test -f .env"
    check "Radicale config exists" "test -f config/radicale.config"
    set -e  # Re-enable exit on error

    # Additional info
    echo ""
    echo "=== Detailed Information ==="
    echo ""

    echo "Container Status:"
    docker compose ps

    echo ""
    echo "Radicale Configuration:"
    docker compose exec radicale cat /var/lib/radicale/privacy.db 2>/dev/null >/dev/null && echo "  Privacy database size: $(docker compose exec radicale du -h /var/lib/radicale/privacy.db | cut -f1)" || echo "  Privacy database: Not initialized"

    echo ""
    echo "Web App Configuration:"
    docker compose exec web test -f /data/local.db && echo "  Web database size: $(docker compose exec web du -h /data/local.db | cut -f1)" || echo "  Web database: Not initialized"

    # Check environment variables
    echo ""
    echo "Critical Environment Variables:"
    if docker compose exec radicale env | grep -q RADICALE_TOKEN; then
        echo -e "  ${GREEN}✓${NC} RADICALE_TOKEN is set"
    else
        echo -e "  ${RED}✗${NC} RADICALE_TOKEN is not set"
    fi

    if docker compose exec web env | grep -q JWT_SECRET; then
        echo -e "  ${GREEN}✓${NC} JWT_SECRET is set"
    else
        echo -e "  ${RED}✗${NC} JWT_SECRET is not set"
    fi

    echo ""
    echo "Development/Mock Mode Configuration:"
    MOCK_EMAIL=$(docker compose exec web env | grep MOCK_EMAIL | cut -d'=' -f2 | tr -d '\r\n')
    MOCK_SMS=$(docker compose exec web env | grep MOCK_SMS | cut -d'=' -f2 | tr -d '\r\n')

    if [ "$MOCK_EMAIL" = "true" ]; then
        echo -e "  ${YELLOW}⚠${NC} MOCK_EMAIL is enabled (development mode)"
    else
        echo -e "  ${GREEN}✓${NC} MOCK_EMAIL is disabled (production mode)"
    fi

    if [ "$MOCK_SMS" = "true" ]; then
        echo -e "  ${YELLOW}⚠${NC} MOCK_SMS is enabled (development mode)"
    else
        echo -e "  ${GREEN}✓${NC} MOCK_SMS is disabled (production mode)"
    fi

    echo ""
    echo "SSL/TLS Domain Configuration:"
    if [ -f .env ] && grep -q "^DOMAIN=" .env; then
        DOMAIN=$(grep "^DOMAIN=" .env | cut -d'=' -f2)
        if [ "$DOMAIN" = "your-domain.com" ] || [ -z "$DOMAIN" ]; then
            echo -e "  ${YELLOW}⚠${NC} DOMAIN not configured (using placeholder)"
        else
            echo -e "  ${GREEN}✓${NC} DOMAIN is set to: $DOMAIN"
        fi
    else
        echo -e "  ${RED}✗${NC} DOMAIN is not set"
    fi

    if [ -f .env ] && grep -q "^EMAIL=" .env; then
        EMAIL=$(grep "^EMAIL=" .env | cut -d'=' -f2)
        if [ "$EMAIL" = "admin@your-domain.com" ] || [ -z "$EMAIL" ]; then
            echo -e "  ${YELLOW}⚠${NC} EMAIL not configured (using placeholder)"
        else
            echo -e "  ${GREEN}✓${NC} EMAIL is set to: $EMAIL"
        fi
    else
        echo -e "  ${RED}✗${NC} EMAIL is not set"
    fi

    # Docker stats
    echo ""
    echo "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "(radicale|web)" || true

    # Summary
    echo ""
    echo "=== Summary ==="
    echo -e "Checks passed: ${GREEN}$CHECKS_PASSED${NC}"
    echo -e "Checks failed: ${RED}$CHECKS_FAILED${NC}"

    if [ $CHECKS_FAILED -eq 0 ]; then
        echo ""
        echo -e "${GREEN}All systems operational!${NC}"
        return 0
    else
        echo ""
        echo -e "${RED}Some checks failed. Review the output above.${NC}"
        return 1
    fi
}

# Show logs if any check failed
show_logs_on_failure() {
    if [ $CHECKS_FAILED -gt 0 ]; then
        echo ""
        echo "Recent logs:"
        echo ""
        echo "Radicale logs:"
        docker compose logs --tail=5 radicale
        echo ""
        echo "Web app logs:"
        docker compose logs --tail=5 web
    fi
}

# Execute
main
show_logs_on_failure
