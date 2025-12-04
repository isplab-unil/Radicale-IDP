/**
 * Phone number validation and normalization utilities.
 * Uses libphonenumber-js for proper country-specific validation.
 */

import { parsePhoneNumber, isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';

/**
 * Validate and normalize phone number to E.164 format.
 * Uses libphonenumber-js for proper country-specific validation.
 *
 * @param phone - Phone number to validate (e.g., "+12345678901")
 * @param defaultCountry - Default country code if not in number (default: "US")
 * @returns Normalized E.164 phone number
 * @throws Error if phone number is invalid
 *
 * @example
 * normalizePhoneE164("+1 (234) 567-8901") // Returns: "+12345678901"
 * normalizePhoneE164("+33123456789")      // Returns: "+33123456789"
 */
export function normalizePhoneE164(phone: string, defaultCountry: string = 'US'): string {
  try {
    // Remove formatting characters
    const cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');

    // Parse and validate
    if (!isValidPhoneNumber(cleaned, defaultCountry as CountryCode)) {
      throw new Error(`Invalid phone number: ${phone}`);
    }

    const phoneNumber = parsePhoneNumber(cleaned, defaultCountry as CountryCode);
    return phoneNumber.format('E.164');
  } catch (error) {
    throw new Error(
      `Could not validate phone number '${phone}': ${error instanceof Error ? error.message : error}`
    );
  }
}

/**
 * Check if a string is a valid phone number in E.164 format.
 *
 * @param phone - Phone number to check
 * @returns True if valid E.164 phone number
 *
 * @example
 * isValidE164("+12345678901")  // Returns: true
 * isValidE164("+1234567890")   // Returns: false (too short for US)
 * isValidE164("invalid")       // Returns: false
 */
export function isValidE164(phone: string): boolean {
  try {
    normalizePhoneE164(phone);
    return true;
  } catch {
    return false;
  }
}
