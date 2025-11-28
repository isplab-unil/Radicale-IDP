#!/bin/sh
set -e

echo "=== SSL Certificate Acquisition Script ==="
echo "Current environment variables:"
echo "  DOMAIN: ${DOMAIN:-<not set>}"
echo "  EMAIL: ${EMAIL:-<not set>}"
echo ""

# Load domain and email from environment
DOMAIN="${DOMAIN}"
EMAIL="${EMAIL}"

if [ -z "$DOMAIN" ]; then
  echo "ERROR: DOMAIN environment variable not set"
  exit 1
fi

if [ -z "$EMAIL" ]; then
  echo "ERROR: EMAIL environment variable not set"
  exit 1
fi

live_cert="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"

# Check if certificate already exists
if [ -f "$live_cert" ]; then
  echo "Certificate already exists at $live_cert"
  exit 0
fi

echo "Obtaining SSL certificate for ${DOMAIN}..."

# Obtain certificate via certbot
certbot certonly --webroot \
  -w /var/www/letsencrypt \
  -d "${DOMAIN}" \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email

echo "Certificate obtained successfully!"
echo "Now switching nginx to HTTPS configuration..."

# Process the HTTPS configuration template
export SSL_CERTIFICATE="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
export SSL_CERTIFICATE_KEY="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"

envsubst '${SSL_CERTIFICATE} ${SSL_CERTIFICATE_KEY}' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf

# Test nginx configuration
nginx -t

# Reload nginx to apply HTTPS configuration
nginx -s reload

echo "Done! Nginx is now running with HTTPS."
