#!/bin/sh
# Initialize default Radicale user data from zip files
# This script runs on container startup and:
# 1. Checks if collections are empty (first startup)
# 2. If empty, loops through all .zip files in /default-data/
# 3. For each zip file, creates a user in htpasswd and extracts their data

set -e

COLLECTIONS_DIR="/var/lib/radicale/collections/collection-root"
HTPASSWD_FILE="/var/lib/radicale/htpasswd"
DEFAULT_DATA_DIR="/default-data"
DEFAULT_PASSWORD="${DEFAULT_USER_PASSWORD:-password}"

# Check if collections directory is empty (first startup)
if [ -d "$COLLECTIONS_DIR" ] && [ "$(ls -A "$COLLECTIONS_DIR" 2>/dev/null)" ]; then
    echo "Collections already exist. Skipping initialization."
    exit 0
fi

echo "Collections directory is empty. Initializing default data..."

# Create collections directory if it doesn't exist
mkdir -p "$COLLECTIONS_DIR"

# Process all zip files in default-data directory
if [ ! -d "$DEFAULT_DATA_DIR" ]; then
    echo "Warning: $DEFAULT_DATA_DIR directory not found. Skipping data initialization."
    exit 0
fi

ZIP_COUNT=0
for zipfile in "$DEFAULT_DATA_DIR"/*.zip; do
    # Check if any zip files exist
    [ -f "$zipfile" ] || continue

    ZIP_COUNT=$((ZIP_COUNT + 1))
    username=$(basename "$zipfile" .zip)

    echo "Processing user: $username"

    # Add user to htpasswd file with bcrypt encryption (-B flag)
    if [ ! -f "$HTPASSWD_FILE" ]; then
        # First user - create file with -c flag
        htpasswd -bcB "$HTPASSWD_FILE" "$username" "$DEFAULT_PASSWORD"
    else
        # Subsequent users - append without -c flag
        htpasswd -bB "$HTPASSWD_FILE" "$username" "$DEFAULT_PASSWORD"
    fi

    # Extract user data to collections directory
    unzip -q -o "$zipfile" -d "$COLLECTIONS_DIR/"

    echo "  - User '$username' created with password '$DEFAULT_PASSWORD'"
done

if [ "$ZIP_COUNT" -eq 0 ]; then
    echo "No zip files found in $DEFAULT_DATA_DIR. No users created."
else
    echo "Initialized $ZIP_COUNT user(s) from zip files."

    # Set proper ownership and permissions
    chown -R radicale:radicale /var/lib/radicale/collections

    if [ -f "$HTPASSWD_FILE" ]; then
        chown radicale:radicale "$HTPASSWD_FILE"
        chmod 600 "$HTPASSWD_FILE"
    fi

    echo "Default data initialization complete!"
fi
