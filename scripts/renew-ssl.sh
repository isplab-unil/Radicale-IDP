#!/bin/bash
# SSL Certificate Renewal Script for Radicale-IDP
# Manually trigger SSL certificate renewal

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Radicale-IDP SSL Certificate Renewal ===${NC}\n"

# Check if services are running
if ! docker compose ps | grep -q "radicale-idp-certbot"; then
    echo -e "${RED}Error: Certbot container is not running${NC}"
    echo "Start services with: docker compose up -d"
    exit 1
fi

# Show current certificate expiration
echo -e "${YELLOW}Checking current certificate expiration...${NC}"
if docker compose exec nginx test -f /etc/nginx/ssl/live/cert.pem 2>/dev/null; then
    docker compose exec nginx openssl x509 -in /etc/nginx/ssl/live/cert.pem -noout -dates
else
    echo -e "${RED}No certificate found${NC}"
    echo "Run ./scripts/setup-ssl.sh first"
    exit 1
fi

echo -e "\n${YELLOW}Attempting certificate renewal...${NC}"

# Attempt renewal
docker compose exec certbot certbot renew

# Check if renewal was successful
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Certificate renewal successful!${NC}"

    # Reload nginx to use renewed certificate
    echo -e "${YELLOW}Reloading nginx...${NC}"
    docker compose exec nginx nginx -s reload

    echo -e "\n${GREEN}=== Renewal Complete! ===${NC}"
    echo -e "${GREEN}Nginx reloaded with renewed certificate${NC}"

    # Show new expiration date
    echo -e "\n${YELLOW}New certificate expiration:${NC}"
    docker compose exec nginx openssl x509 -in /etc/nginx/ssl/live/cert.pem -noout -dates
else
    echo -e "\n${YELLOW}No certificates were renewed${NC}"
    echo "This is normal if certificates are not due for renewal (30+ days remaining)"
    echo -e "\nTo force renewal: docker compose exec certbot certbot renew --force-renewal"
fi
