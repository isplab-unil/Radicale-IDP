#!/bin/sh
set -e

# Self-signed certificate mode
if [ "$SELF_SIGNED_SSL" = "true" ]; then
    echo "Running in SELF-SIGNED SSL mode"

    # Continuous loop for certificate renewal
    while true; do
        # Check if certificates exist and are valid
        if [ -f /etc/ssl/self-signed/fullchain.pem ]; then
            # Check if certificate expires within 10 days (864000 seconds)
            if openssl x509 -checkend 864000 -noout -in /etc/ssl/self-signed/fullchain.pem; then
                echo "Self-signed certificate is valid, sleeping for 1 day"
                sleep 1d
                continue
            fi
        fi

        # Generate new self-signed certificate
        echo "Generating self-signed certificate..."
        mkdir -p /etc/ssl/self-signed
        openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
            -keyout /etc/ssl/self-signed/privkey.pem \
            -out /etc/ssl/self-signed/fullchain.pem \
            -subj "/CN=localhost"

        echo "Self-signed certificate created"
        sleep 1d
    done

# Let's Encrypt certificate mode
else
    echo "Running in LET'S ENCRYPT mode"

    # Validate required environment variables
    if [ -z "$DOMAIN" ]; then
        echo "ERROR: DOMAIN environment variable is required for Let's Encrypt mode"
        exit 1
    fi

    if [ -z "$EMAIL" ]; then
        echo "ERROR: EMAIL environment variable is required for Let's Encrypt mode"
        exit 1
    fi

    # Initial certificate acquisition
    if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        echo "No certificate found for $DOMAIN, obtaining one..."
        certbot certonly --webroot \
            -w /var/www/letsencrypt \
            -d "$DOMAIN" \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email

        if [ $? -ne 0 ]; then
            echo "ERROR: Failed to obtain certificate"
            exit 1
        fi
    fi

    # Continuous renewal loop
    while true; do
        echo "Checking for certificate renewal..."
        certbot renew --webroot -w /var/www/letsencrypt

        # Sleep for 24 hours before next check
        sleep 1d
    done
fi
