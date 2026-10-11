// Date inputs hold `yyyy-MM-dd`; most backend payloads want `dd/MM/yyyy`.

const pad = (value: number) => String(value).padStart(2, '0')

export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const todayIso = () => toIsoDate(new Date())

/** Today shifted by whole days and years, as `yyyy-MM-dd`. */
export function shiftedIso({ days = 0, years = 0 }: { days?: number; years?: number }, from = new Date()) {
  const date = new Date(from.getFullYear() + years, from.getMonth(), from.getDate() + days)
  return toIsoDate(date)
}

/** `yyyy-MM-dd` → `dd/MM/yyyy`. Empty stays empty. */
export const isoToDisplay = (iso: string) => {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

/** Age in whole years from a `yyyy-MM-dd` date. NaN when the date is empty. */
export function ageFromIso(iso: string, today = new Date()): number {
  if (!iso) return Number.NaN
  const [year, month, day] = iso.split('-').map(Number)
  const hadBirthday =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day)
  return today.getFullYear() - year - (hadBirthday ? 0 : 1)
}
