#!/bin/sh
# Build zip archives from user directories in default-data/
# This script runs during Docker build and creates zip files
# for each user directory found in /default-data/

set -e

DEFAULT_DATA_DIR="/default-data"

if [ ! -d "$DEFAULT_DATA_DIR" ]; then
    echo "Warning: $DEFAULT_DATA_DIR directory not found. Skipping zip creation."
    exit 0
fi

cd "$DEFAULT_DATA_DIR"

USER_COUNT=0
for userdir in */; do
    # Check if any directories exist
    [ -d "$userdir" ] || continue

    username=$(basename "$userdir")
    zipfile="${username}.zip"

    # Skip if zip already exists (allows manually added zip files)
    if [ -f "$zipfile" ]; then
        echo "Zip file $zipfile already exists. Skipping."
        continue
    fi

    echo "Creating $zipfile from $userdir"
    zip -q -r "$zipfile" "$userdir"
    USER_COUNT=$((USER_COUNT + 1))
done

if [ "$USER_COUNT" -eq 0 ]; then
    echo "No new zip files created (all already exist or no directories found)."
else
    echo "Created $USER_COUNT zip file(s)."
fi

# List all zip files for verification
echo "Available zip files:"
ls -lh *.zip 2>/dev/null || echo "  (none)"
