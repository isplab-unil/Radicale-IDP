#!/bin/sh
# Ensure every vCard in default-data/ has a UID property
#
# CardDAV clients expect a UID in every vCard. This script scans all
# .vcf files in the per-user subfolders of default-data/ and inserts a
# deterministic UID where one is missing:
#
#   UID = <user subfolder name><vcf file name>, alphanumeric characters only
#
# e.g. default-data/user1@example.com/addressbook/john-doe.vcf
#   -> UID:user1examplecomjohndoe
#
# The script is idempotent: cards that already have a UID are left
# untouched, so re-running it never changes existing data.
#
# Usage: ./scripts/add-vcard-uids.sh [default_data_dir]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEFAULT_DATA_DIR="${1:-$PROJECT_ROOT/default-data}"

if [ ! -d "$DEFAULT_DATA_DIR" ]; then
    echo "Error: $DEFAULT_DATA_DIR not found"
    exit 1
fi

COUNT_FILE="$(mktemp "${TMPDIR:-/tmp}/add-vcard-uids.XXXXXX")"
trap 'rm -f "$COUNT_FILE"' EXIT
: > "$COUNT_FILE"

# vCards live at <default-data>/<user>/<collection>/<name>.vcf
find "$DEFAULT_DATA_DIR" -mindepth 3 -maxdepth 3 -type f -name '*.vcf' -exec sh -c '
    count_file="$1"
    shift
    for vcf do
        if grep -qi "^UID:" "$vcf"; then
            echo skipped >> "$count_file"
            continue
        fi

        user_dir="$(basename "$(dirname "$(dirname "$vcf")")")"
        card_name="$(basename "$vcf" .vcf)"

        # Deterministic UID, alphanumeric characters only
        uid="$(printf "%s%s" "$user_dir" "$card_name" | tr -cd "[:alnum:]")"

        if [ -z "$uid" ]; then
            echo "Warning: could not build a UID for $vcf, skipping"
            echo skipped >> "$count_file"
            continue
        fi

        # Insert UID right after the BEGIN:VCARD line
        awk -v uid="$uid" "
            BEGIN { inserted = 0 }
            /^BEGIN:VCARD/ && !inserted {
                print
                print \"UID:\" uid
                inserted = 1
                next
            }
            { print }
        " "$vcf" > "$vcf.tmp"
        mv "$vcf.tmp" "$vcf"

        echo "Added UID:$uid to $vcf"
        echo added >> "$count_file"
    done
' sh "$COUNT_FILE" {} +

ADDED=$(grep -c '^added$' "$COUNT_FILE" 2>/dev/null || true)
SKIPPED=$(grep -c '^skipped$' "$COUNT_FILE" 2>/dev/null || true)

echo ""
echo "Done: $ADDED UID(s) added, $SKIPPED card(s) already had a UID."
