#!/bin/sh
set -e

echo "Starting nginx with SSL configuration..."

# Set SSL certificate paths based on SELF_SIGNED_SSL environment variable
if [ "$SELF_SIGNED_SSL" = "true" ]; then
    echo "Using SELF-SIGNED SSL certificates"
    export SSL_CERTIFICATE="/etc/ssl/self-signed/fullchain.pem"
    export SSL_CERTIFICATE_KEY="/etc/ssl/self-signed/privkey.pem"
else
    echo "Using LET'S ENCRYPT SSL certificates"
    if [ -z "$DOMAIN" ]; then
        echo "ERROR: DOMAIN environment variable is required for Let's Encrypt mode"
        exit 1
    fi
    export SSL_CERTIFICATE="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
    export SSL_CERTIFICATE_KEY="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"
fi

echo "SSL_CERTIFICATE=${SSL_CERTIFICATE}"
echo "SSL_CERTIFICATE_KEY=${SSL_CERTIFICATE_KEY}"

# Process nginx configuration template with envsubst
echo "Processing nginx configuration templates..."
envsubst '${SSL_CERTIFICATE} ${SSL_CERTIFICATE_KEY}' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf

# Verify nginx configuration
echo "Verifying nginx configuration..."
nginx -t

# Start nginx in the foreground
echo "Starting nginx..."
exec nginx -g 'daemon off;'
