"""Privacy enforcement module for Radicale.

This module handles the enforcement of privacy settings on vCard items.
"""

import logging
from typing import Dict, List, Tuple

import radicale.item as radicale_item
from radicale.privacy.database import PrivacyDatabase
from radicale.privacy.vcard_properties import (PRIVACY_TO_VCARD_MAP,
                                               PUBLIC_VCARD_PROPERTIES,
                                               VCARD_NAME_TO_ENUM)
from radicale.utils import normalize_phone_e164

logger = logging.getLogger(__name__)


class PrivacyEnforcement:
    """Class to handle privacy enforcement on vCard items."""

    # Class-level storage for privacy enforcement instances
    _instances: Dict[str, 'PrivacyEnforcement'] = {}

    @classmethod
    def get_instance(cls, configuration) -> 'PrivacyEnforcement':
        """Get or create a privacy enforcement instance for the given configuration."""
        config_id = str(id(configuration))
        if config_id not in cls._instances:
            cls._instances[config_id] = cls(configuration)
        return cls._instances[config_id]

    @classmethod
    def close_all(cls):
        """Close all privacy enforcement instances."""
        for instance in cls._instances.values():
            instance.close()
        cls._instances.clear()

    def __init__(self, configuration):
        """Initialize the privacy enforcement with configuration."""
        self._privacy_db = None
        self._configuration = configuration

    def _ensure_db_connection(self):
        """Ensure the database connection is established."""
        if self._privacy_db is None:
            self._privacy_db = PrivacyDatabase(self._configuration)
            self._privacy_db.init_db()

    def _extract_identifiers(self, vcard) -> List[Tuple[str, str]]:
        """Extract all identifiers (email and phone) from a vCard."""
        identifiers = []

        # Extract emails
        if hasattr(vcard, "email_list"):
            for email_prop in vcard.email_list:
                if email_prop.value:
                    identifiers.append(("email", email_prop.value))
                    logger.debug("PRIVACY: Found email in vCard: %r", email_prop.value)

        # Extract phones
        if hasattr(vcard, "tel_list"):
            for tel_prop in vcard.tel_list:
                if tel_prop.value:
                    try:
                        normalized = normalize_phone_e164(tel_prop.value)
                        identifiers.append(("phone", normalized))
                    except Exception:
                        identifiers.append(("phone", tel_prop.value))
                    logger.debug("PRIVACY: Found phone in vCard: %r", tel_prop.value)

        return identifiers

    def _is_valid_vcard_property(self, property_name: str) -> bool:
        """Check if a property name is a valid vCard property."""
        return property_name.lower() in VCARD_NAME_TO_ENUM

    def enforce_privacy(self, item: radicale_item.Item) -> radicale_item.Item:
        """Enforce privacy settings on a vCard item by filtering disallowed properties."""
        if not item.component_name == "VCARD" and not item.name == "VCARD":
            logger.debug("PRIVACY: Not a VCF file")
            return item

        logger.info("PRIVACY: Intercepted vCard for privacy enforcement")
        logger.debug("PRIVACY: vCard content:\n%s", item.serialize())

        # Get identifiers from vCard
        identifiers = self._extract_identifiers(item.vobject_item)
        if not identifiers:
            logger.debug("PRIVACY: No email or phone found in vCard")
            return item

        # Ensure database connection is established
        self._ensure_db_connection()

        # Get privacy settings for each identifier
        privacy_settings = None
        for id_type, id_value in identifiers:
            settings = self._privacy_db.get_user_settings(id_value)
            if settings:
                # Log all current privacy settings
                settings_dict = {
                    property: getattr(settings, property)
                    for property in PRIVACY_TO_VCARD_MAP.keys()
                }
                logger.info("PRIVACY: Found privacy settings for %s %r: %s", id_type, id_value, settings_dict)
                if privacy_settings is None:
                    privacy_settings = settings
                else:
                    # Apply most restrictive settings when multiple matches found
                    for property in PRIVACY_TO_VCARD_MAP.keys():
                        current_value = getattr(privacy_settings, property)
                        new_value = getattr(settings, property)
                        setattr(privacy_settings, property, current_value or new_value)

        if not privacy_settings:
            logger.debug("PRIVACY: No privacy settings found for any identifier")
            return item

        # Process the vCard
        logger.info("PRIVACY: Processing vCard for privacy enforcement")
        vcard = item.vobject_item

        # Get all properties to remove based on privacy settings
        properties_to_remove: set[str] = set()
        for privacy_property, vcard_properties in PRIVACY_TO_VCARD_MAP.items():
            logger.debug("PRIVACY: Checking privacy property %s with value %s", privacy_property, getattr(privacy_settings, privacy_property, None))
            if getattr(privacy_settings, privacy_property, False):
                logger.debug("PRIVACY: Privacy property %s is enabled, will remove properties: %s", privacy_property, vcard_properties)
                properties_to_remove.update(prop.lower() for prop in vcard_properties)

        logger.debug("PRIVACY: Properties to remove: %s", properties_to_remove)
        logger.debug("PRIVACY: Current vCard properties: %s", list(vcard.contents.keys()))

        # Remove disallowed properties
        for property_name in list(vcard.contents.keys()):
            # Skip if property is public
            if property_name.lower() in PUBLIC_VCARD_PROPERTIES:
                logger.debug("PRIVACY: Skipping public property: %s", property_name)
                continue

            # Skip if not a valid vCard property
            if not self._is_valid_vcard_property(property_name.lower()):
                logger.debug("PRIVACY: Skipping unhandled property: %s", property_name)
                continue

            # Remove if property is in the disallowed list (case-insensitive comparison)
            if property_name.lower() in properties_to_remove:
                logger.debug("PRIVACY: Removing disallowed property: %s", property_name)
                del vcard.contents[property_name]

        # Invalidate the item's text cache since we modified the vCard
        item._text = None
        return item

    def close(self):
        """Close the privacy database connection."""
        if self._privacy_db:
            self._privacy_db.close()
            self._privacy_db = None
