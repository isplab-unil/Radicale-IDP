# Nginx Reverse Proxy Configuration

This directory contains the nginx reverse proxy configuration for Radicale-IDP.

## Overview

The nginx container acts as a reverse proxy, handling:
- SSL/TLS termination with Let's Encrypt certificates
- HTTP to HTTPS redirects
- Routing traffic to backend services:
  - `/` → Radicale CalDAV/CardDAV server (port 5232)
  - `/web` → React privacy management UI (port 3000)
- CalDAV/CardDAV `.well-known` redirects for auto-discovery

## Directory Structure

```
nginx/
├── nginx.conf           # Main nginx configuration
├── conf.d/
│   └── default.conf     # Server blocks (HTTP/HTTPS)
├── ssl/
│   └── README.md        # SSL certificate documentation
└── README.md            # This file
```

## Configuration Files

### nginx.conf

Main nginx configuration containing:
- Worker process settings
- Logging configuration
- MIME types
- Gzip compression
- Include directives

**Do not modify** unless you need to change global nginx settings.

### conf.d/default.conf

Server block configuration with:

**HTTP Server (Port 80):**
- Serves Let's Encrypt ACME challenges (`.well-known/acme-challenge/`)
- Redirects all other traffic to HTTPS

**HTTPS Server (Port 443):**
- SSL/TLS configuration
- Security headers (HSTS, X-Frame-Options, etc.)
- CalDAV/CardDAV well-known redirects
- Proxy configuration for Radicale and Web UI

**Modify this file** to customize routing, add domains, or adjust proxy settings.

## URL Structure

| Path | Backend Service | Purpose |
|------|----------------|---------|
| `/` | radicale:5232 | CalDAV/CardDAV server |
| `/web` | web:3000 | Privacy management web UI |
| `/.well-known/caldav` | → `/` redirect | CalDAV auto-discovery |
| `/.well-known/carddav` | → `/` redirect | CardDAV auto-discovery |
| `/.well-known/acme-challenge/` | nginx | Let's Encrypt validation |

## SSL/TLS Certificates

Certificates are managed by the certbot container and stored in a Docker volume.

See [ssl/README.md](ssl/README.md) for:
- Initial certificate setup
- Automatic renewal
- Manual renewal
- Troubleshooting

## Customization

### Adding a Custom Domain

1. Update `.env` file:
   ```bash
   DOMAIN=your-domain.com
   EMAIL=admin@your-domain.com
   ```

2. Update `conf.d/default.conf`:
   ```nginx
   server_name your-domain.com www.your-domain.com;
   ```

3. Obtain SSL certificate:
   ```bash
   ./scripts/setup-ssl.sh
   ```

### Changing URL Paths

To serve Radicale at `/radicale` instead of `/`:

1. Edit `conf.d/default.conf`:
   ```nginx
   location /radicale/ {
       proxy_pass http://radicale:5232/;
       proxy_set_header X-Script-Name /radicale;
       # ... other headers
   }
   ```

2. Update well-known redirects:
   ```nginx
   location /.well-known/carddav {
       return 301 $scheme://$host/radicale/;
   }
   ```

3. Reload nginx:
   ```bash
   docker compose exec nginx nginx -s reload
   ```

### Adding Security Headers

Already included in `default.conf`:
- `Strict-Transport-Security` (HSTS)
- `X-Frame-Options`
- `X-Content-Type-Options`
- `X-XSS-Protection`

To add more headers (e.g., CSP):
```nginx
add_header Content-Security-Policy "default-src 'self'" always;
```

### Adjusting Timeouts

For large calendar/contact imports, increase timeouts in `default.conf`:

```nginx
location / {
    proxy_read_timeout 600s;      # 10 minutes
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    client_max_body_size 200M;    # Larger uploads
}
```

## Testing Configuration

Before reloading nginx, test configuration syntax:

```bash
docker compose exec nginx nginx -t
```

If valid, reload:

```bash
docker compose exec nginx nginx -s reload
```

## Logs

View nginx access and error logs:

```bash
# Access log
docker compose logs nginx | grep "GET\|POST"

# Error log
docker compose logs nginx | grep "error"

# Follow logs in real-time
docker compose logs -f nginx
```

## Troubleshooting

### Nginx Won't Start

**Certificate not found:**
```
nginx: [emerg] cannot load certificate
```

**Solution:** Generate a self-signed certificate first:
```bash
docker compose exec nginx sh -c "mkdir -p /etc/nginx/ssl/live && \
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/live/privkey.pem \
  -out /etc/nginx/ssl/live/cert.pem \
  -subj '/CN=localhost'"
```

### 502 Bad Gateway

**Backend service unavailable:**

**Solution:** Check if backend services are running:
```bash
docker compose ps
docker compose logs radicale
docker compose logs web
```

### Configuration Syntax Error

**Invalid nginx configuration:**

**Solution:** Test configuration before reloading:
```bash
docker compose exec nginx nginx -t
```

### SSL Certificate Issues

See [ssl/README.md](ssl/README.md) for SSL-specific troubleshooting.

## Performance Tuning

For high-traffic deployments, adjust in `nginx.conf`:

```nginx
worker_processes auto;  # Already set
worker_connections 2048;  # Increase from 1024

# Enable caching
proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

# In location blocks
proxy_cache my_cache;
proxy_cache_valid 200 10m;
```

## Security Best Practices

1. **Keep nginx updated:** Regularly pull latest alpine image
2. **Use strong SSL ciphers:** Already configured in default.conf
3. **Enable HSTS:** Already configured (31536000 seconds = 1 year)
4. **Limit request rates:** Add rate limiting if needed
5. **Monitor logs:** Watch for suspicious activity
6. **Firewall:** Only expose ports 80 and 443

## References

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Radicale Reverse Proxy Guide](https://radicale.org/v3.html#reverse-proxy)
- [CalDAV/CardDAV Standards](https://tools.ietf.org/html/rfc4791)
