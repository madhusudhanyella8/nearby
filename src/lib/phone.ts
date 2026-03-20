/**
 * Normalize an Indian phone number:
 * - Strip +91, 0 prefix, spaces, dashes
 * - Return plain 10-digit number
 */
export function normalizePhone(raw: string): string {
  // Remove all non-digit characters
  let digits = raw.replace(/\D/g, "");
  // Strip leading 91 (country code) if 12 digits
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  // Strip leading 0 if 11 digits
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * Validate that a normalized phone is a valid 10-digit Indian mobile number
 */
export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}
