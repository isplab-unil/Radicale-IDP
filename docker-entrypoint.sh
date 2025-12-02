#!/bin/sh
# Docker entrypoint script for Radicale
# Initializes default data on first startup, then starts Radicale

set -e

# Run initialization script
/scripts/init-default-data.sh

# Start Radicale with original command
exec /app/bin/python -m radicale --hosts "0.0.0.0:5232,[::]:5232"
