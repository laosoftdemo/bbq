// lib/phoneAuth.js
// Converts a Lao phone number to the canonical storage format and
// to the synthetic email Supabase Auth requires.

/**
 * Normalize a phone number to a consistent storage format.
 * Strips spaces, dashes, parens. Keeps leading 0 as typed locally.
 * Example: "020 5512 345" -> "0205512345"
 */
export function normalizePhone(raw) {
  if (!raw) return ''
  return raw.replace(/[\s\-\(\)]/g, '').trim()
}

/**
 * Validate that a normalized phone looks like a plausible Lao mobile number.
 * Lao mobile numbers start with 0 and commonly run 9-11 digits total
 * (e.g. older 020-XXX-XXX formats and newer 020-XXXX-XXXX formats both exist).
 * Kept permissive — primarily guards against obviously malformed input,
 * not a strict telecom-grade validator.
 */
export function isValidLaoPhone(normalized) {
  return /^0\d{8,10}$/.test(normalized)
}

/**
 * Convert a normalized phone number into the synthetic email used
 * for Supabase Auth (which requires an email-shaped identifier).
 * Example: "0205512345" -> "0205512345@test.com"
 */
export function phoneToFakeEmail(normalizedPhone) {
  return `${normalizedPhone}@test.com`
}

/**
 * Reverse lookup: extract the phone number back out of a fake email.
 * Example: "0205512345@test.com" -> "0205512345"
 */
export function fakeEmailToPhone(email) {
  return email.split('@')[0]
}