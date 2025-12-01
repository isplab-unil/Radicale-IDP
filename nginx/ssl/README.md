# SSL Certificate Configuration

SSL certificates are **automatically managed** by the certbot container using entrypoint scripts. No manual setup required!

### Certificate Locations

**Self-signed certificates (development):**
- Location: `volumes/ssl/self-signed/`
- Files: `fullchain.pem`, `privkey.pem`

**Let's Encrypt certificates (production):**
- Location: `volumes/certbot/conf/live/${DOMAIN}/`
- Files: `fullchain.pem`, `privkey.pem`, `chain.pem`, `cert.pem`

### Configuration Modes

The system operates in two modes controlled by the `SELF_SIGNED_SSL` environment variable in `.env`:

#### Development Mode (Default)

```bash
# In .env file
SELF_SIGNED_SSL=true
```

- Automatically generates self-signed certificates on first run
- Certificates valid for 365 days
- Auto-renewed 10 days before expiration
- No domain or email configuration needed

#### Production Mode

```bash
# In .env file
SELF_SIGNED_SSL=false
DOMAIN=your-domain.com
EMAIL=your-email@example.com
```

**Prerequisites:**
1. Point your domain DNS to your server's IP address
2. Ensure ports 80 and 443 are open in your firewall
3. Configure `DOMAIN` and `EMAIL` in `.env`

**Setup:**
1. Set the environment variables in `.env`
2. Start services: `docker compose up -d`
3. The certbot container will automatically obtain Let's Encrypt certificates
4. Certificates auto-renew every 24 hours (renewed 30 days before expiration)

## How It Works

### Certbot Entrypoint (`volumes/certbot/certbot-entrypoint.sh`)

Automatically:
- Generates self-signed certificates in dev mode
- Obtains Let's Encrypt certificates in production mode
- Monitors and renews certificates in the background
- Runs in a continuous loop with daily checks

### Nginx Entrypoint (`volumes/nginx/nginx-entrypoint.sh`)

Automatically:
- Detects certificate mode from `SELF_SIGNED_SSL`
- Configures nginx with correct certificate paths using `envsubst`
- Processes template files to generate final nginx configuration
- Starts nginx with the appropriate SSL configuration

## Manual Operations

### Check Certificate Status

```bash
# View certbot logs
docker compose logs certbot

# Check certificate expiration (self-signed)
openssl x509 -enddate -noout -in volumes/ssl/self-signed/fullchain.pem

# Check certificate expiration (Let's Encrypt)
docker compose exec certbot certbot certificates
```

### Force Certificate Renewal

```bash
# Let's Encrypt mode only
docker compose exec certbot certbot renew --force-renewal

# Restart nginx to load renewed certificates
docker compose restart nginx
```

### Switch Between Modes

```bash
# Switch to production mode
# 1. Update .env file
SELF_SIGNED_SSL=false
DOMAIN=your-domain.com
EMAIL=your-email@example.com

# 2. Restart services
docker compose down
docker compose up -d

# Switch to development mode
# 1. Update .env file
SELF_SIGNED_SSL=true

# 2. Restart services
docker compose down
docker compose up -d
```

## Troubleshooting

### Nginx Won't Start

Check certificate existence:
```bash
# For self-signed mode
ls -la volumes/ssl/self-signed/

# For Let's Encrypt mode
docker compose exec certbot ls -la /etc/letsencrypt/live/
```

If certificates are missing:
```bash
# Manually trigger certificate generation
docker compose restart certbot
docker compose logs -f certbot
```

### Let's Encrypt Certificate Acquisition Failed

1. Verify DNS points to your server:
   ```bash
   dig your-domain.com
   nslookup your-domain.com
   ```

2. Check firewall allows HTTP (port 80):
   ```bash
   sudo ufw status
   curl -I http://your-domain.com/.well-known/acme-challenge/test
   ```

3. Check certbot logs:
   ```bash
   docker compose logs certbot
   ```

4. Common issues:
   - DNS not propagated (wait 24-48 hours after DNS changes)
   - Port 80 blocked by firewall
   - Domain doesn't point to server
   - Let's Encrypt rate limit hit (50 certs per domain per week)

### Certificate Renewal Failed

Check logs and retry:
```bash
docker compose logs certbot
docker compose restart certbot
```

## Migration from Old System

If migrating from the previous manual SSL setup:

1. **Backup old certificates** (if they exist in named volumes):
   ```bash
   docker volume inspect nginx_certs
   # Copy certificates from volume location if needed
   ```

2. **Update configuration**:
   - The new system uses bind mounts in `volumes/` directory
   - Named volumes `nginx_certs` and `nginx_challenge` are no longer used

3. **Start fresh**:
   ```bash
   docker compose down
   docker compose up -d
   ```

The new system will automatically generate/obtain certificates.

## Security Notes

- Self-signed certificates show browser warnings - **development only**
- Let's Encrypt certificates are trusted by all browsers and clients
- Private keys are stored in local `volumes/` directory
- Never commit `volumes/ssl/` or `volumes/certbot/conf/` to version control
- Add to `.gitignore`: `volumes/ssl/`, `volumes/certbot/conf/`
- Let's Encrypt rate limit: 50 certificates per registered domain per week
- Certificate auto-renewal happens daily, no manual intervention needed

## Health Check

Use the health check script to verify SSL configuration:
```bash
./scripts/health-check.sh
```

This will show:
- SSL mode (self-signed vs Let's Encrypt)
- Certificate existence and expiration
- Domain/email configuration status
- All service health status
