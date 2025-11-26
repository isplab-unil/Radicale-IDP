# SSL Certificate Configuration

This directory contains SSL/TLS certificates for the nginx reverse proxy.

## Initial Setup

On first deployment, you'll need to obtain SSL certificates from Let's Encrypt using certbot.

### Prerequisites

1. Point your domain DNS to your server's IP address
2. Ensure ports 80 and 443 are open in your firewall
3. Set `DOMAIN` and `EMAIL` variables in your `.env` file

### Obtaining Certificates

After starting the services with `docker compose up -d`, run:

```bash
# Replace with your actual domain and email
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d your-domain.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email
```

### Certificate Locations

Certificates are stored in a Docker named volume (`nginx_certs`) and mapped to:
- Certificate: `/etc/nginx/ssl/live/cert.pem`
- Private Key: `/etc/nginx/ssl/live/privkey.pem`
- Chain: `/etc/nginx/ssl/live/chain.pem`
- Full Chain: `/etc/nginx/ssl/live/fullchain.pem`

## Automatic Renewal

The certbot container automatically checks for certificate renewals every 12 hours. Certificates are renewed 30 days before expiration.

To manually trigger renewal:

```bash
docker compose exec certbot certbot renew
docker compose exec nginx nginx -s reload
```

## Self-Signed Certificate (Development Only)

For local development without a domain, you can generate a self-signed certificate:

```bash
docker compose exec nginx sh -c "mkdir -p /etc/nginx/ssl/live && \
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/live/privkey.pem \
  -out /etc/nginx/ssl/live/cert.pem \
  -subj '/CN=localhost'"

docker compose exec nginx nginx -s reload
```

**Warning:** Self-signed certificates will show security warnings in browsers and CalDAV/CardDAV clients. Only use for development.

## Troubleshooting

### Certificate Not Found

If nginx fails to start with "certificate not found" error:

1. Check that certificates exist:
   ```bash
   docker compose exec nginx ls -la /etc/nginx/ssl/live/
   ```

2. Generate a temporary self-signed certificate (see above)

3. Obtain Let's Encrypt certificate

4. Reload nginx

### Renewal Failed

If automatic renewal fails:

1. Check certbot logs:
   ```bash
   docker compose logs certbot
   ```

2. Verify domain DNS points to server

3. Check firewall allows port 80

4. Manually renew:
   ```bash
   docker compose exec certbot certbot renew --force-renewal
   ```

## Security Notes

- Private keys are stored in a Docker volume and never exposed to the host filesystem
- Certificates are read-only mounted in nginx container
- Let's Encrypt rate limits: 50 certificates per registered domain per week
- Keep your private keys secure - never commit them to version control
