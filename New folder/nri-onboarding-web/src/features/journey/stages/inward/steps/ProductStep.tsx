import { useFormContext, useWatch } from 'react-hook-form'
import { CheckboxField, CheckboxGroupField, FieldShell, RadioGroupField } from '@/components/form'
import { DescriptionList } from '@/components/shared/DescriptionList'
import { Badge } from '@/components/ui/badge'
import { canTradeFno, CONTRACT_NOTE_OPTIONS, deriveProducts, NRI_TYPE_OPTIONS } from '../rules'
import type { InwardValues } from '../schema'

export function ProductStep() {
  const { setValue, control } = useFormContext<InwardValues>()
  const nriTypes = useWatch({ control, name: 'nriTypes' })
  const fno = useWatch({ control, name: 'fno' })
  const products = deriveProducts(nriTypes, fno)
  const productNames = [
    products.equity && 'Equity',
    products.mutualFunds && 'Mutual Funds',
    products.fno && 'FNO',
  ].filter(Boolean)

  return (
    <div className="grid gap-5">
      <CheckboxGroupField
        name="nriTypes"
        label="NRI Type"
        required
        options={NRI_TYPE_OPTIONS}
        // FNO starts ticked when NRO NONPIS is chosen and is dropped when it is not.
        onValueChange={(next) => setValue('fno', canTradeFno(next))}
      />

      <FieldShell id="inward-products" group label="Products" description="Set by the NRI types selected above">
        <div className="flex min-h-6 flex-wrap gap-2" aria-labelledby="inward-products">
          {productNames.length > 0 ? (
            productNames.map((name) => (
              <Badge key={String(name)} variant="secondary">
                {name}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Select an NRI type</span>
          )}
        </div>
      </FieldShell>

      {canTradeFno(nriTypes) && (
        <CheckboxField name="fno" label="Enable FNO (available with NRO NONPIS)" />
      )}

      <RadioGroupField name="contractNote" label="Contract Note" required options={CONTRACT_NOTE_OPTIONS} />

      <DescriptionList
        items={[
          { label: 'Residential Status', value: 'NRI' },
          { label: 'Account Type', value: 'Individual' },
          { label: 'Account With', value: 'NSDL' },
        ]}
      />
    </div>
  )
}
