#!/bin/bash
# SSL Certificate Setup Script for Radicale-IDP
# This script helps set up SSL certificates for the nginx reverse proxy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Radicale-IDP SSL Certificate Setup ===${NC}\n"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create a .env file with DOMAIN and EMAIL variables"
    echo "Example:"
    echo "  DOMAIN=your-domain.com"
    echo "  EMAIL=your-email@example.com"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Error: DOMAIN not set in .env file${NC}"
    exit 1
fi

if [ -z "$EMAIL" ]; then
    echo -e "${RED}Error: EMAIL not set in .env file${NC}"
    exit 1
fi

echo -e "${GREEN}Domain:${NC} $DOMAIN"
echo -e "${GREEN}Email:${NC} $EMAIL\n"

# Check if services are running
echo -e "${YELLOW}Checking if services are running...${NC}"
if ! docker compose ps | grep -q "radicale-idp-nginx"; then
    echo -e "${YELLOW}Services not running. Starting them now...${NC}"
    docker compose up -d
    echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
    sleep 30
fi

# Check if certificates already exist
echo -e "\n${YELLOW}Checking for existing certificates...${NC}"
if docker compose exec nginx test -f /etc/nginx/ssl/live/cert.pem 2>/dev/null; then
    echo -e "${GREEN}Certificates already exist!${NC}"
    docker compose exec nginx ls -la /etc/nginx/ssl/live/
    echo -e "\n${YELLOW}To renew certificates, use: ./scripts/renew-ssl.sh${NC}"
    exit 0
fi

echo -e "${YELLOW}No certificates found. Creating self-signed certificate first...${NC}"

# Generate self-signed certificate for initial nginx startup
docker compose exec nginx sh -c "mkdir -p /etc/nginx/ssl/live && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/live/privkey.pem \
    -out /etc/nginx/ssl/live/cert.pem \
    -subj '/CN=$DOMAIN'"

echo -e "${GREEN}Self-signed certificate created${NC}"

# Reload nginx to use self-signed certificate
echo -e "${YELLOW}Reloading nginx...${NC}"
docker compose exec nginx nginx -s reload

echo -e "\n${GREEN}=== Obtaining Let's Encrypt Certificate ===${NC}\n"
echo -e "${YELLOW}Important:${NC}"
echo -e "  1. Ensure $DOMAIN points to this server's IP address"
echo -e "  2. Ensure ports 80 and 443 are open in your firewall"
echo -e "  3. Press Ctrl+C to cancel if not ready\n"

read -p "Continue with Let's Encrypt certificate? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Aborted. Using self-signed certificate.${NC}"
    echo -e "${YELLOW}Run this script again when ready for Let's Encrypt.${NC}"
    exit 0
fi

# Obtain Let's Encrypt certificate
echo -e "\n${YELLOW}Requesting certificate from Let's Encrypt...${NC}"

docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal

# Check if certificate was obtained successfully
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Certificate obtained successfully!${NC}"

    # Link the Let's Encrypt certificates to nginx expected location
    echo -e "${YELLOW}Linking certificates for nginx...${NC}"
    docker compose exec nginx sh -c "ln -sf /etc/nginx/ssl/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/live/cert.pem && \
        ln -sf /etc/nginx/ssl/live/$DOMAIN/privkey.pem /etc/nginx/ssl/live/privkey.pem"

    # Reload nginx to use new certificate
    echo -e "${YELLOW}Reloading nginx with Let's Encrypt certificate...${NC}"
    docker compose exec nginx nginx -s reload

    echo -e "\n${GREEN}=== SSL Setup Complete! ===${NC}"
    echo -e "${GREEN}Your site is now accessible at: https://$DOMAIN${NC}"
    echo -e "\nCertificates will auto-renew every 12 hours via the certbot container."
else
    echo -e "\n${RED}Failed to obtain Let's Encrypt certificate${NC}"
    echo -e "${YELLOW}Still using self-signed certificate${NC}"
    echo -e "\nTroubleshooting:"
    echo -e "  1. Check DNS: dig $DOMAIN"
    echo -e "  2. Check firewall: sudo ufw status"
    echo -e "  3. Check logs: docker compose logs certbot"
    exit 1
fi
