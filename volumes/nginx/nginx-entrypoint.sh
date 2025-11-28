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

# Check if SSL certificates exist
if [ ! -f "$SSL_CERTIFICATE" ] || [ ! -f "$SSL_CERTIFICATE_KEY" ]; then
    echo "WARNING: SSL certificates not found!"
    echo "Starting nginx in HTTP-only mode for ACME challenge..."

    # Create a minimal HTTP-only configuration
    cat > /etc/nginx/conf.d/default.conf <<'EOF'
# HTTP-only configuration for SSL certificate acquisition
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    # Temporary message for other requests
    location / {
        return 503 'SSL certificates are being obtained. Please run: obtain-ssl-certificate.sh\n';
        add_header Content-Type text/plain;
    }
}
EOF

    echo ""
    echo "=========================================="
    echo "Nginx started in HTTP-only mode."
    echo "To obtain SSL certificates, run:"
    echo "  podman compose exec nginx obtain-ssl-certificate.sh"
    echo "=========================================="
    echo ""
else
    # Certificates exist, process the full HTTPS configuration
    echo "SSL certificates found, processing HTTPS configuration..."
    envsubst '${SSL_CERTIFICATE} ${SSL_CERTIFICATE_KEY}' \
        < /etc/nginx/templates/default.conf.template \
        > /etc/nginx/conf.d/default.conf

    # Verify nginx configuration
    echo "Verifying nginx configuration..."
    nginx -t
fi

# Start nginx in the foreground
echo "Starting nginx..."
exec nginx -g 'daemon off;'
