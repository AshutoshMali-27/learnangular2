import { useMutation } from '@tanstack/react-query'
import { CircleCheck, Loader2, Search } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { CheckboxField, DateField, SelectField, TextField } from '@/components/form'
import { DescriptionList } from '@/components/shared/DescriptionList'
import { Button } from '@/components/ui/button'
import { todayIso } from '@/lib/dates'
import { filters, PATTERNS } from '@/lib/validators'
import { journeyService } from '../../services'
import type { Journey } from '../../types'
import { ACCOUNT_TYPES, type BankAccountConfig } from './rules'
import { emptyAccount, type BankAccountValues, type BankValues } from './schema'

interface BankAccountBlockProps {
  journey: Journey
  config: BankAccountConfig
  /** The other account of the same type, whose "default" tick is cleared when this one is ticked. */
  siblingCode?: string
  disabled?: boolean
}

/**
 * One bank account: find the branch by IFSC, enter the account, then validate it with the
 * bank check. A validated account is locked until Reset.
 */
export function BankAccountBlock({ journey, config, siblingCode, disabled }: BankAccountBlockProps) {
  const { control, getValues, setValue, setError, clearErrors, getFieldState, formState } =
    useFormContext<BankValues>()
  const path = `accounts.${config.code}` as const
  const account: BankAccountValues = useWatch({ control, name: path }) ?? emptyAccount(false)
  const validated = account.status === 'valid'
  const locked = disabled || validated

  const findBranch = useMutation({
    mutationFn: (ifsc: string) => journeyService.findIfsc(ifsc),
    onSuccess: (branch) => {
      if (!branch) {
        setValue(`${path}.branchId`, '')
        setError(`${path}.ifsc`, { type: 'lookup', message: 'No branch found for this IFSC' })
        return
      }
      clearErrors(`${path}.ifsc`)
      setValue(`${path}.ifsc`, branch.ifsc)
      setValue(`${path}.branchId`, branch.branchId)
      setValue(`${path}.bankName`, branch.bankName)
      setValue(`${path}.branchName`, branch.branchName)
    },
    onError: (error) => setError(`${path}.ifsc`, { type: 'lookup', message: getErrorMessage(error) }),
  })

  const checkBank = useMutation({
    mutationFn: () => {
      const current = getValues(path)
      return journeyService.checkBank({
        pan: journey.progress.pan,
        accountNo: current.accountNo,
        ifsc: current.ifsc,
        branchId: current.branchId,
        accountType: current.accountType,
      })
    },
    onSuccess: () => {
      setValue(`${path}.status`, 'valid', { shouldValidate: true })
      toast.success(`${config.label}: bank account details are valid`)
    },
    onError: (error) => {
      setValue(`${path}.status`, 'invalid')
      toast.error(getErrorMessage(error))
    },
  })

  const reset = () => {
    findBranch.reset()
    checkBank.reset()
    setValue(path, emptyAccount(config.alwaysDefault || account.isDefault))
    clearErrors(path)
  }

  // A changed IFSC no longer matches the branch that was found for the old one.
  const clearBranch = () => {
    setValue(`${path}.branchId`, '')
    setValue(`${path}.bankName`, '')
    setValue(`${path}.branchName`, '')
  }

  const statusError = getFieldState(`${path}.status`, formState).error?.message
  const canValidate = Boolean(account.branchId && account.accountNo && account.accountType)

  return (
    <fieldset disabled={disabled} className="grid gap-4 rounded-md border p-4 disabled:opacity-60">
      <legend className="flex items-center gap-2 px-1 text-sm font-medium">
        {config.label}
        {validated && <CircleCheck className="size-4 text-primary" aria-label="Validated" />}
      </legend>

      <div className="flex items-start gap-2">
        <TextField
          name={`${path}.ifsc`}
          label="IFSC Code"
          required
          maxLength={11}
          transform={filters.upperAlnum}
          onValueChange={clearBranch}
          readOnly={locked}
          className="min-w-0 flex-1 sm:max-w-xs"
        />
        <div className="pt-[1.375rem]">
          <Button
            type="button"
            variant="outline"
            disabled={locked || findBranch.isPending || !PATTERNS.ifsc.test(account.ifsc)}
            onClick={() => findBranch.mutate(account.ifsc)}
          >
            {findBranch.isPending ? <Loader2 className="animate-spin" /> : <Search />}
            Find branch
          </Button>
        </div>
      </div>

      <DescriptionList
        className="lg:grid-cols-2"
        items={[
          { label: 'Bank Name', value: account.bankName },
          { label: 'Branch Name', value: account.branchName },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name={`${path}.accountNo`}
          label="Account Number"
          required
          maxLength={20}
          transform={filters.alnum}
          readOnly={locked}
        />
        <SelectField
          name={`${path}.accountType`}
          label="Account Type"
          required
          options={ACCOUNT_TYPES}
          disabled={locked}
        />
        {config.requireRbi && (
          <>
            <TextField
              name={`${path}.rbiRefNo`}
              label="RBI Reference Number"
              required
              maxLength={50}
              transform={(value) => value.toUpperCase().replace(/[^A-Z0-9/\\\-. ]/g, '')}
            />
            <DateField name={`${path}.rbiRefDate`} label="RBI Reference Date" required max={todayIso()} />
          </>
        )}
      </div>

      <CheckboxField
        name={`${path}.isDefault`}
        label="Set as default account"
        disabled={config.alwaysDefault}
        description={config.alwaysDefault ? 'The only account of this type is always the default' : undefined}
        onValueChange={(checked) => {
          // Only one account of a type can be the default.
          if (checked && siblingCode) setValue(`accounts.${siblingCode}.isDefault`, false)
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={validated ? 'secondary' : 'default'}
          disabled={locked || checkBank.isPending || !canValidate}
          onClick={() => checkBank.mutate()}
        >
          {checkBank.isPending && <Loader2 className="animate-spin" />}
          {validated ? 'Validated' : 'Validate Bank'}
        </Button>
        <Button type="button" variant="outline" disabled={checkBank.isPending} onClick={reset}>
          Reset
        </Button>
        {statusError && (
          <p role="alert" className="text-xs text-destructive">
            {statusError}
          </p>
        )}
      </div>
    </fieldset>
  )
}
