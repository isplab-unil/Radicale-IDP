#!/bin/sh
# Initialize default Radicale user data from directories or zip files
# This script runs on container startup and:
# 1. Checks if collections are empty (first startup)
# 2. If empty, processes both directories and zip files in /default-data/
# 3. For each user, creates a htpasswd entry and copies/extracts their data

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

# Check if default-data directory exists
if [ ! -d "$DEFAULT_DATA_DIR" ]; then
    echo "Warning: $DEFAULT_DATA_DIR directory not found. Skipping data initialization."
    exit 0
fi

USER_COUNT=0

# Process all items in default-data directory
cd "$DEFAULT_DATA_DIR"

for item in *; do
    # Skip if nothing found (glob didn't match anything)
    [ -e "$item" ] || continue

    # Determine username and type
    if [ -d "$item" ]; then
        # It's a directory
        username="$item"
        item_type="directory"
    elif [ -f "$item" ] && [ "${item##*.}" = "zip" ]; then
        # It's a zip file
        username=$(basename "$item" .zip)
        item_type="zipfile"
    else
        # Skip other file types
        continue
    fi

    echo "Processing user: $username (from $item_type)"

    # Add user to htpasswd file with bcrypt encryption (-B flag)
    if [ ! -f "$HTPASSWD_FILE" ]; then
        # First user - create file with -c flag
        htpasswd -bcB "$HTPASSWD_FILE" "$username" "$DEFAULT_PASSWORD"
    else
        # Subsequent users - append without -c flag
        htpasswd -bB "$HTPASSWD_FILE" "$username" "$DEFAULT_PASSWORD"
    fi

    # Copy/extract user data to collections directory
    if [ "$item_type" = "directory" ]; then
        # Direct copy for directories (no compression needed)
        echo "  - Copying directory: $item"
        cp -r "$item" "$COLLECTIONS_DIR/"
    else
        # Unzip for pre-packaged zip files
        echo "  - Extracting zip file: $item"
        unzip -q -o "$item" -d "$COLLECTIONS_DIR/"
    fi

    echo "  - User '$username' created with password '$DEFAULT_PASSWORD'"
    USER_COUNT=$((USER_COUNT + 1))
done

if [ "$USER_COUNT" -eq 0 ]; then
    echo "No users found in $DEFAULT_DATA_DIR. No users created."
else
    echo "Initialized $USER_COUNT user(s)."

    # Set proper ownership and permissions
    chown -R radicale:radicale /var/lib/radicale/collections

    if [ -f "$HTPASSWD_FILE" ]; then
        chown radicale:radicale "$HTPASSWD_FILE"
        chmod 600 "$HTPASSWD_FILE"
    fi

    echo "Default data initialization complete!"
fi
