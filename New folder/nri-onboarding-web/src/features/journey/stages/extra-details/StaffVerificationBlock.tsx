import { useMutation } from '@tanstack/react-query'
import { Loader2, Search } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { DateField, TextField } from '@/components/form'
import { FileUpload } from '@/components/shared/file-upload/FileUpload'
import { Button } from '@/components/ui/button'
import { todayIso } from '@/lib/dates'
import { filters } from '@/lib/validators'
import { journeyService } from '../../services'
import type { Journey } from '../../types'
import { uploadHandler, viewDocument } from '../../upload'
import type { StaffBlockKey } from './schema'

interface StaffVerificationBlockProps {
  journey: Journey
  /** Form path of the block. */
  name: StaffBlockKey
  title: string
  codeLabel: string
  required: boolean
  disabled?: boolean
}

/**
 * Staff code, name, designation, date and signature for one verification (OSV, interview, IPV).
 * "Look up" fetches the staff member's e-sign record and fills the name, designation and signature.
 */
export function StaffVerificationBlock({
  journey,
  name,
  title,
  codeLabel,
  required,
  disabled,
}: StaffVerificationBlockProps) {
  const { getValues, setValue } = useFormContext()

  const lookup = useMutation({
    mutationFn: (code: string) => journeyService.lookupEmployeeSign(code),
    onSuccess: (record) => {
      if (!record) {
        toast.info('No e-sign on record for this staff code. Enter the details and upload the signature.')
        return
      }
      setValue(`${name}.name`, record.name, { shouldValidate: true })
      setValue(`${name}.designation`, record.designation, { shouldValidate: true })
      setValue(`${name}.signature`, record.signature, { shouldValidate: true })
      toast.success(`${record.name}'s details and signature attached`)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const runLookup = () => {
    const code = String(getValues(`${name}.staffCode`) ?? '').trim()
    if (code) lookup.mutate(code)
    else toast.info('Enter the staff code first.')
  }

  return (
    <section className="grid gap-4 rounded-lg border p-4" aria-labelledby={`staff-${name}`}>
      <h3 id={`staff-${name}`} className="text-sm font-medium">
        {title}
        {!required && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </h3>

      <div className="flex items-start gap-2">
        <TextField
          name={`${name}.staffCode`}
          label={codeLabel}
          required={required}
          maxLength={20}
          transform={filters.alnum}
          disabled={disabled}
          className="min-w-0 flex-1 sm:max-w-xs"
        />
        <div className="pt-[1.375rem]">
          <Button type="button" variant="outline" onClick={runLookup} disabled={disabled || lookup.isPending}>
            {lookup.isPending ? <Loader2 className="animate-spin" /> : <Search />}
            Look up
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField name={`${name}.name`} label="Name" required={required} maxLength={100} disabled={disabled} />
        <TextField
          name={`${name}.designation`}
          label="Designation"
          required={required}
          maxLength={100}
          disabled={disabled}
        />
        <DateField name={`${name}.date`} label="Date" required={required} max={todayIso()} disabled={disabled} />
      </div>

      <FileUpload
        name={`${name}.signature`}
        label="Signature"
        required={required}
        accept={['.jpg', '.jpeg', '.png']}
        onUpload={uploadHandler('extraDetails', journey)}
        onView={viewDocument}
        disabled={disabled}
        className="max-w-md"
      />
    </section>
  )
}
