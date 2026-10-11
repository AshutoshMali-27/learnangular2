import { useFormContext } from 'react-hook-form'
import { SelectField, TextField, VerifiableField } from '@/components/form'
import { useSessionUser } from '@/features/auth'
import { useRelations } from '@/features/masters'
import { filters, isValidEmail, PATTERNS } from '@/lib/validators'
import { journeyService, type ContactCheck } from '../../../services'
import type { InwardValues } from '../schema'

// Inward captures the client's own contact details, so only "Self" is offered (as in MVC).
const SELF_RELATION_ID = '0'

export function ContactStep({ formNo }: { formNo: string }) {
  const { getValues } = useFormContext<InwardValues>()
  const user = useSessionUser()
  const relations = useRelations()
  const selfOnly = relations.data?.filter((relation) => relation.value === SELF_RELATION_ID)

  const check = (value: string): ContactCheck => ({
    value,
    pan: getValues('pan'),
    formNo,
    empId: user.empId,
  })

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <VerifiableField
          name="email"
          statusName="emailStatus"
          label="Email ID"
          required
          type="email"
          maxLength={120}
          autoComplete="off"
          canVerify={isValidEmail}
          onVerify={(email) => journeyService.checkEmail(check(email)).then(() => ({ valid: true }))}
        />
        <SelectField
          name="emailRelation"
          label="Email Relationship"
          required
          options={selfOnly}
          isLoading={relations.isPending}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
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
          onVerify={(mobile) => journeyService.checkMobile(check(mobile)).then(() => ({ valid: true }))}
        />
        <SelectField
          name="mobileRelation"
          label="Mobile Relationship"
          required
          options={selfOnly}
          isLoading={relations.isPending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,16rem)]">
        <TextField name="isdCode" label="ISD Code" inputMode="numeric" maxLength={4} transform={filters.digits} />
        <TextField
          name="telephone"
          label="Telephone No."
          inputMode="numeric"
          maxLength={15}
          transform={filters.digits}
        />
      </div>
    </div>
  )
}
