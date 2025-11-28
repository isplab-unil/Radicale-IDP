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
  echo "Switching nginx to HTTPS configuration..."
else
  echo "Certificate not found. Waiting for certbot container to obtain it..."
  echo "(The certbot container should be running and will automatically obtain the certificate)"
  echo ""

  # Wait for the certbot container to create the certificate
  max_wait=120  # 2 minutes
  waited=0
  while [ ! -f "$live_cert" ] && [ $waited -lt $max_wait ]; do
    sleep 5
    waited=$((waited + 5))
    echo "Waiting for certificate... (${waited}s / ${max_wait}s)"
  done

  if [ ! -f "$live_cert" ]; then
    echo ""
    echo "ERROR: Certificate was not created after ${max_wait} seconds"
    echo "Please check:"
    echo "  1. Is the certbot container running? Run: podman compose ps"
    echo "  2. Check certbot logs: podman compose logs certbot"
    echo "  3. Ensure port 80 is accessible from the internet for ACME challenge"
    exit 1
  fi

  echo "Certificate obtained successfully!"
fi

echo "Now switching nginx to HTTPS configuration..."

# Process the HTTPS configuration template
export SSL_CERTIFICATE="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
export SSL_CERTIFICATE_KEY="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"

envsubst '${SSL_CERTIFICATE} ${SSL_CERTIFICATE_KEY}' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

# Reload nginx to apply HTTPS configuration
echo "Reloading nginx..."
nginx -s reload

echo ""
echo "=========================================="
echo "Done! Nginx is now running with HTTPS."
echo "=========================================="
