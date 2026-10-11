// Port of the MVC `Validation.*` helpers (Docs/UI/00-Common-Layout.md §3), as reusable
// patterns, predicates and input filters. Zod schemas build on these.

export const PATTERNS = {
  /** Individual PAN: the 4th character must be P. */
  pan: /^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  mobile: /^\d{6,15}$/,
  pincode: /^[1-9][0-9]{5}$/,
  aadhaar: /^\d{12}$/,
  passport: /^[A-Z][0-9]{7}$/,
  voterId: /^[A-Z]{3}[0-9]{7}$/,
  drivingLicense: /^[A-Z]{2}\d{2}\s?\d{11}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  accountNo: /^\d{9,18}$/,
  personName: /^[A-Za-z]+( [A-Za-z]+)*$/,
} as const

const BLOCKED_EMAIL_DOMAINS = ['sharekhan.com', 'miraeassetcm.com']

export const isValidPan = (value: string) => PATTERNS.pan.test(value) && new Set(value).size > 1

export const isBlockedEmailDomain = (value: string) =>
  BLOCKED_EMAIL_DOMAINS.includes(value.split('@')[1]?.toLowerCase() ?? '')

export const isValidEmail = (value: string) =>
  PATTERNS.email.test(value) && !isBlockedEmailDomain(value)

/** Input filters: pass as a field's `transform` to restrict what can be typed or pasted. */
export const filters = {
  upperAlnum: (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
  alnum: (value: string) => value.replace(/[^A-Za-z0-9]/g, ''),
  digits: (value: string) => value.replace(/\D/g, ''),
  /** Address text: letters, digits, space and - / , . with repeated spaces collapsed. */
  addressLine: (value: string) =>
    value.replace(/[^A-Za-z0-9 /,.-]/g, '').replace(/ {2,}/g, ' ').trimStart(),
  /** Letters with single spaces, no leading space. */
  personName: (value: string) => value.replace(/[^A-Za-z ]/g, '').replace(/ {2,}/g, ' ').trimStart(),
} as const
