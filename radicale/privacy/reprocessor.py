"""Privacy reprocessing module for Radicale.

This module provides functionality to reprocess vCards when privacy settings change.
"""

import logging
from typing import List

from radicale.item import Item
from radicale.privacy.enforcement import PrivacyEnforcement
from radicale.privacy.scanner import PrivacyScanner

logger = logging.getLogger(__name__)


class PrivacyReprocessor:
    """Class to handle reprocessing of vCards when privacy settings change."""

    def __init__(self, configuration, storage):
        """Initialize the reprocessor.

        Args:
            configuration: The Radicale configuration object
            storage: The Radicale storage instance
        """
        self._configuration = configuration
        self._storage = storage
        self._enforcement = PrivacyEnforcement.get_instance(configuration)
        self._scanner = PrivacyScanner(storage)

    def reprocess_vcards(self, identity: str) -> List[str]:
        """Reprocess all vCards containing a specific identity with current privacy settings.

        Args:
            identity: The email or phone number to search for

        Returns:
            List of vCard UIDs that were successfully reprocessed
        """
        logger.info("PRIVACY: Starting vCard reprocessing for identity: %r", identity)
        reprocessed_cards = []

        try:
            # Find all vCards containing this identity
            matches = self._scanner.find_identity_occurrences(identity)
            logger.info("PRIVACY: Found %d vCards containing identity %r", len(matches), identity)

            # Log to database for statistics
            try:
                from radicale.privacy.database import PrivacyDatabase
                privacy_db = PrivacyDatabase(self._configuration)
                privacy_db.log_vcard_action("reprocess_started", identity, details={"total_vcards": len(matches)})
            except Exception as e:
                logger.debug("PRIVACY: Could not log to database: %s", e)

            # Process each vCard
            for match in matches:
                try:
                    collection_path = match['collection_path']
                    vcard_uid = match['vcard_uid']

                    logger.debug("PRIVACY: Processing vCard %r in collection %r", vcard_uid, collection_path)

                    # Get the collection using discover
                    discover_path = "/" + collection_path.lstrip("/")
                    collections = list(self._storage.discover(discover_path))

                    if not collections:
                        logger.warning("PRIVACY: Collection not found: %r", collection_path)
                        continue

                    collection = collections[0]

                    # Get all items in the collection
                    items = list(collection.get_all())
                    item = None
                    original_href = None
                    for i in items:
                        if (isinstance(i, Item) and
                                (i.component_name == "VCARD" or i.name == "VCARD") and
                                hasattr(i.vobject_item, "uid") and
                                i.vobject_item.uid.value == vcard_uid):
                            item = i
                            original_href = i.href
                            break

                    if not item:
                        logger.warning("PRIVACY: vCard %r not found in collection", vcard_uid)
                        continue

                    # Apply privacy enforcement
                    modified_item = self._enforcement.enforce_privacy(item)

                    # Save the modified vCard using the original filename
                    try:
                        collection.upload(original_href, modified_item)
                        logger.debug("PRIVACY: Successfully updated vCard %r", vcard_uid)
                        reprocessed_cards.append(vcard_uid)

                        # Log successful vCard processing to database
                        try:
                            privacy_db.log_vcard_action("processed", identity, vcard_uid, collection_path)
                        except Exception as e:
                            logger.debug("PRIVACY: Could not log vCard processing to database: %s", e)

                    except Exception as e:
                        logger.error("PRIVACY: Failed to save vCard %r: %s", vcard_uid, str(e))

                except Exception as e:
                    logger.error("PRIVACY: Error processing vCard: %s", str(e))

            logger.info("PRIVACY: Reprocessing complete. %d cards were updated", len(reprocessed_cards))

            # Log completion to database
            try:
                privacy_db.log_vcard_action("reprocess_completed", identity, details={
                    "total_vcards": len(matches),
                    "successfully_processed": len(reprocessed_cards)
                })
            except Exception as e:
                logger.debug("PRIVACY: Could not log completion to database: %s", e)

            return reprocessed_cards

        except Exception as e:
            logger.error("PRIVACY: Reprocessing failed: %s", str(e))
            raise
