import { CheckboxField, ComboboxField, SelectField, VerifiableField } from '@/components/form'
import { DescriptionList } from '@/components/shared/DescriptionList'
import { useSessionUser } from '@/features/auth'
import { useAdmins, useServingBranches } from '@/features/masters'
import { filters } from '@/lib/validators'
import { journeyService, type CodeKind } from '../../../services'

export function BranchStep() {
  const user = useSessionUser()
  const admins = useAdmins()
  const branches = useServingBranches()

  const validate = (kind: CodeKind) => (code: string) =>
    journeyService.validateCode(kind, code, user.branchId).then(() => ({ valid: true }))

  return (
    <div className="grid gap-5">
      <DescriptionList items={[{ label: 'Branch Code', value: user.branchTypeCode }]} />

      <div className="grid gap-4 sm:grid-cols-2">
        <ComboboxField
          name="preferredBranch"
          label="Preferred Branch Code"
          options={branches.data}
          isLoading={branches.isPending}
          searchPlaceholder="Search branch…"
          clearable
        />
        <SelectField name="admin" label="Admin Name" required options={admins.data} isLoading={admins.isPending} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <VerifiableField
          name="leadId"
          statusName="leadStatus"
          label="Lead ID"
          inputMode="numeric"
          maxLength={10}
          transform={filters.digits}
          onVerify={validate('lead')}
          description="Optional. If entered, it must be validated."
        />
        <VerifiableField
          name="salesCode"
          statusName="salesStatus"
          label="Sales Executive Code"
          required
          maxLength={10}
          transform={filters.alnum}
          onVerify={validate('sales')}
        />
      </div>

      <CheckboxField name="hni" label="HNI client" />
    </div>
  )
}
