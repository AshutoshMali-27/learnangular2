import type { Option } from '@/components/form'

/** Country master id for India (Docs/UI/02-Address.md §4). */
export const INDIA_COUNTRY_ID = '2'

/** Pincode the backend expects for any address outside India. */
export const FOREIGN_PINCODE = '111111'

export const NAME_PREFIXES: Option[] = ['Mr.', 'Mrs.', 'Miss', 'Ms.', 'Dr.'].map((prefix) => ({
  value: prefix,
  label: prefix,
}))

export const RESIDENTIAL_STATUSES: Option[] = [
  { value: 'RI', label: 'Resident Individual' },
  { value: 'NRI', label: 'NRI' },
  { value: 'FI', label: 'Foreign National' },
  { value: 'PIO', label: 'Person of Indian Origin' },
]

export const GENDERS: Option[] = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
]

export const MARITAL_STATUSES: Option[] = [
  { value: 'M', label: 'Married' },
  { value: 'U', label: 'Unmarried' },
  { value: 'W', label: 'Widow' },
]
