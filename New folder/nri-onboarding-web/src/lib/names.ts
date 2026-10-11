export interface NameParts {
  firstName: string
  middleName: string
  lastName: string
}

/**
 * Splits the NSDL name returned by PAN verification (Docs/UI/01-Inward.md §4):
 * 1 word → first; 2 → first + last; 3+ → first, all middle words, last.
 */
export function splitFullName(fullName: string): NameParts {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length <= 1) return { firstName: words[0] ?? '', middleName: '', lastName: '' }
  return {
    firstName: words[0],
    middleName: words.slice(1, -1).join(' '),
    lastName: words[words.length - 1],
  }
}

export const joinName = (...parts: (string | null | undefined)[]) =>
  parts.map((part) => part?.trim()).filter(Boolean).join(' ')
