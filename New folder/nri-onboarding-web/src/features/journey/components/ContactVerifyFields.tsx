import { SelectField, VerifiableField } from '@/components/form'
import { useRelations } from '@/features/masters'
import { filters, isValidEmail, PATTERNS } from '@/lib/validators'

// The form captures each person's own contact details, so only "Self" is offered (as in MVC).
const SELF_RELATION_ID = '0'

interface ContactVerifyFieldsProps {
  /** Server checks; reject with the reason when the value cannot be used. */
  onCheckEmail: (email: string) => Promise<unknown>
  onCheckMobile: (mobile: string) => Promise<unknown>
  /** Local reasons to refuse a value before calling the server (duplicates within the form). */
  rejectEmail?: (email: string) => string | undefined
  rejectMobile?: (mobile: string) => string | undefined
}

const verifyWith =
  (check: (value: string) => Promise<unknown>, reject?: (value: string) => string | undefined) =>
  async (value: string) => {
    const reason = reject?.(value)
    if (reason) return { valid: false, message: reason }
    await check(value)
    return { valid: true }
  }

/**
 * Verified email and mobile with their relationship selects. Expects the form paths
 * `email`, `emailStatus`, `emailRelation`, `mobile`, `mobileStatus`, `mobileRelation`.
 */
export function ContactVerifyFields({
  onCheckEmail,
  onCheckMobile,
  rejectEmail,
  rejectMobile,
}: ContactVerifyFieldsProps) {
  const relations = useRelations()
  const selfOnly = relations.data?.filter((relation) => relation.value === SELF_RELATION_ID)
  const columns = 'grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'

  return (
    <div className="grid gap-5">
      <div className={columns}>
        <VerifiableField
          name="email"
          statusName="emailStatus"
          label="Email ID"
          required
          type="email"
          maxLength={120}
          autoComplete="off"
          canVerify={isValidEmail}
          onVerify={verifyWith(onCheckEmail, rejectEmail)}
        />
        <SelectField
          name="emailRelation"
          label="Email Relationship"
          required
          options={selfOnly}
          isLoading={relations.isPending}
        />
      </div>
      <div className={columns}>
        <VerifiableField
          name="mobile"
          statusName="mobileStatus"
          label="Mobile No."
          required
          inputMode="numeric"
          maxLength={15}
          autoComplete="off"
          transform={filters.digits}
          canVerify={(mobile) => PATTERNS.mobile.test(mobile)}
          onVerify={verifyWith(onCheckMobile, rejectMobile)}
        />
        <SelectField
          name="mobileRelation"
          label="Mobile Relationship"
          required
          options={selfOnly}
          isLoading={relations.isPending}
        />
      </div>
    </div>
  )
}
