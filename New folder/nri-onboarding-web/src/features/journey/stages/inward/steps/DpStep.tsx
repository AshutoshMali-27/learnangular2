import { useFormContext, useWatch } from 'react-hook-form'
import { SelectField, TextField, YesNoField } from '@/components/form'
import { DescriptionList } from '@/components/shared/DescriptionList'
import { useDpMaster } from '@/features/masters'
import { filters } from '@/lib/validators'
import { defaultDpId, hasNre, hasNro, HOUSE_DP_NAME } from '../rules'
import type { InwardValues } from '../schema'

function DpPanel({ side, name, linked }: { side: 'NRE' | 'NRO'; name: 'nreDp' | 'nroDp'; linked: boolean }) {
  const { control } = useFormContext<InwardValues>()
  const accountWith = useWatch({ control, name: 'accountWith' })
  const dpId = useWatch({ control, name: `${name}.dpId` })
  const dps = useDpMaster()

  return (
    <section className="grid gap-3 rounded-md border p-4">
      <h3 className="text-sm font-medium">
        {side} {linked ? 'Existing DP Details' : 'DP Details'}
      </h3>
      {linked ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            name={`${name}.dpId`}
            label={`${side} DP Name`}
            required
            options={dps.data}
            isLoading={dps.isPending}
          />
          <DescriptionList className="sm:grid-cols-1 lg:grid-cols-1" items={[{ label: `${side} DP ID`, value: dpId }]} />
          <TextField
            name={`${name}.clientId`}
            label={`${side} Client ID`}
            required
            inputMode="numeric"
            maxLength={8}
            transform={filters.digits}
            description="8 digits"
          />
        </div>
      ) : (
        <DescriptionList
          items={[
            { label: `${side} DP Name`, value: HOUSE_DP_NAME },
            { label: `${side} DP ID`, value: defaultDpId(accountWith) },
          ]}
        />
      )}
    </section>
  )
}

export function DpStep() {
  const { control } = useFormContext<InwardValues>()
  const nriTypes = useWatch({ control, name: 'nriTypes' })
  const linked = useWatch({ control, name: 'linkExistingDp' }) === 'Y'

  return (
    <div className="grid gap-5">
      <YesNoField name="linkExistingDp" label="Link with existing DP" required />
      {hasNre(nriTypes) && <DpPanel side="NRE" name="nreDp" linked={linked} />}
      {hasNro(nriTypes) && <DpPanel side="NRO" name="nroDp" linked={linked} />}
    </div>
  )
}
