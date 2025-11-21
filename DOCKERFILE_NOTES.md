# Radicale-IDP Dockerfile Configuration Guide

This project includes two Dockerfile options for building the Radicale server component.

## Available Dockerfiles

### Dockerfile (Original)
**Use case:** Building official Radicale from GitHub release
**Source:** Downloads and installs Radicale from GitHub (https://github.com/Kozea/Radicale)
**Advantages:**
- Uses official Radicale source
- Good for unmodified deployments
- Smaller final image

**Disadvantages:**
- Doesn't include privacy extensions (this fork's custom code)
- Need to rebuild to test local changes
- Can't deploy your customizations

### Dockerfile.local (Recommended for this fork)
**Use case:** Building from local source code with privacy extensions
**Source:** Builds from local `/app/src` (your cloned repository)
**Advantages:**
- Includes privacy extensions and customizations
- Uses your fork's code
- Good for deployment and testing

**Disadvantages:**
- Larger build context
- Includes development files in image

## Which One to Use?

### For Deployment (Recommended)
Use `Dockerfile.local` to ensure you're deploying the privacy extension fork:

```bash
docker build -f Dockerfile.local -t radicale-idp:latest .
```

### For Development/Testing
Use `Dockerfile.local` with volume mounting:

```bash
docker run -v /path/to/radicale:/app/src \
           -v radicale_data:/var/lib/radicale \
           radicale-idp:latest
```

### For CI/CD Pipeline
Create a production build step:

```bash
# Build with version tag
docker build -f Dockerfile.local \
             -t radicale-idp:1.0.0 \
             -t radicale-idp:latest .

# Push to registry
docker push your-registry/radicale-idp:1.0.0
```

## Docker Compose Configuration

### Using Dockerfile.local (Default)

The default `docker-compose.yml` is configured to use the standard Dockerfile. To use the local build instead, modify the `radicale` service:

**Option 1: Update docker-compose.yml**
```yaml
services:
  radicale:
    build:
      context: .
      dockerfile: Dockerfile.local  # Use this instead of default
    # ... rest of config
```

**Option 2: Override at build time**
```bash
docker-compose build --build-arg DOCKERFILE=Dockerfile.local radicale
docker-compose up -d
```

**Option 3: Use environment variable**
Create a `.env` file with:
```bash
DOCKERFILE=Dockerfile.local
```

Then modify docker-compose.yml:
```yaml
services:
  radicale:
    build:
      context: .
      dockerfile: ${DOCKERFILE:-Dockerfile.local}
```

## Build Process Differences

### Original Dockerfile Flow
1. Builder stage: Install Python, create venv, download Radicale from GitHub
2. Runtime stage: Copy venv, setup user, expose port
3. Size: ~150MB
4. Speed: Depends on network (downloads from GitHub)

### Local Dockerfile Flow
1. Builder stage: Install Python, create venv, copy local source, install with dev dependencies
2. Runtime stage: Copy venv, setup user, expose port
3. Size: ~200MB (includes local source files)
4. Speed: Faster (no network dependency)

## Production Recommendations

### Image Size Optimization
To reduce the final image size with `Dockerfile.local`:

```dockerfile
# Add to Dockerfile.local builder stage:
RUN /app/venv/bin/pip install --no-cache-dir \
    -e /app/src[bcrypt] \
    && rm -rf /app/src/.git /app/src/tests /app/src/*.md

# This removes ~50MB of unnecessary files
```

### Build Arguments
Both Dockerfiles support build arguments:

**Radicale dependencies:**
```bash
docker build -f Dockerfile.local \
             --build-arg DEPENDENCIES=bcrypt,ldap \
             -t radicale-idp:latest .
```

## Web Application Dockerfile

The web app Dockerfile (`web/Dockerfile`) is production-ready with:
- Multi-stage build (dev deps, prod deps, build, runtime)
- Optimized layer caching
- Database migration hooks
- Health checks

**No changes needed for deployment.**

## Migrating Between Dockerfiles

### From original to local build

1. Stop running containers:
   ```bash
   docker-compose down
   ```

2. Update docker-compose.yml:
   ```yaml
   radicale:
     build:
       dockerfile: Dockerfile.local
   ```

3. Rebuild:
   ```bash
   docker-compose build --no-cache radicale
   docker-compose up -d
   ```

4. Verify:
   ```bash
   docker-compose logs radicale
   ```

### From local to original build

Simply change `dockerfile: Dockerfile.local` back to the default or explicit `dockerfile: Dockerfile`.

## Troubleshooting Build Issues

### "module not found" errors
- Ensure `pyproject.toml` exists in project root
- Verify all dependencies are listed in `[project.dependencies]`
- Check that privacy module files are present

### Build context too large
- Use `.dockerignore` to exclude unnecessary files:
  ```
  .git
  __pycache__
  *.pyc
  .pytest_cache
  .venv
  .env
  tests/
  ```

### Permission denied errors
- Ensure Radicale user (UID 1000) owns all mounted volumes
- Fix with: `sudo chown 1000:1000 /path/to/volume`

## Next Steps

1. Choose your Dockerfile (recommended: `Dockerfile.local` for this fork)
2. Update `docker-compose.yml` if needed
3. Follow the deployment guide in `DEPLOYMENT.md`
4. Run health checks: `./scripts/health-check.sh`
