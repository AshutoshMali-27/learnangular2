import { zodResolver } from '@hookform/resolvers/zod'
import type { FormEvent } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { CheckboxGroupField, DateField, SelectField, TextField } from '@/components/form'
import type { Option } from '@/components/form'
import { FileUpload } from '@/components/shared/file-upload/FileUpload'
import { Button } from '@/components/ui/button'
import type { DocumentTypeMeta } from '@/features/masters'
import { shiftedIso, todayIso } from '@/lib/dates'
import { filters } from '@/lib/validators'
import type { Journey } from '../../types'
import { uploadHandler, viewDocument } from '../../upload'
import { storedNumber } from './mapper'
import { allowedCategories, DOC_TYPE } from './rules'
import { createDocumentSchema, DOCUMENT_DEFAULTS, type ProofDocument } from './schema'

interface DocumentFormProps {
  journey: Journey
  docTypes: Option<DocumentTypeMeta>[]
  initial?: ProofDocument
  readOnly?: boolean
  onSave: (document: ProofDocument) => void
  onCancel: () => void
}

/** Add / edit one proof document. Which fields appear depends on the chosen document type. */
export function DocumentForm({ journey, docTypes, initial, readOnly, onSave, onCancel }: DocumentFormProps) {
  const metaOf = (docTypeId: string) => docTypes.find((type) => type.value === docTypeId)?.meta
  const form = useForm<ProofDocument>({
    resolver: zodResolver(createDocumentSchema(metaOf)),
    defaultValues: initial ?? DOCUMENT_DEFAULTS,
    mode: 'onTouched',
  })
  const docTypeId = useWatch({ control: form.control, name: 'docTypeId' })
  const meta = metaOf(docTypeId)
  const categories = allowedCategories(meta)

  const handleTypeChange = (nextId: string) => {
    // A different document type means different fields and categories, so they start over.
    form.reset({
      ...DOCUMENT_DEFAULTS,
      docTypeId: nextId,
      docTypeName: docTypes.find((type) => type.value === nextId)?.label ?? '',
      file: form.getValues('file'),
    })
  }

  const numberFilter =
    docTypeId === DOC_TYPE.PAN
      ? filters.upperAlnum
      : docTypeId === DOC_TYPE.AADHAAR
        ? // Digits while typing; X and - so an already masked number can be shown when editing.
          (value: string) => value.toUpperCase().replace(/[^0-9X-]/g, '')
        : filters.alnum

  const submit = (event: FormEvent) => {
    // The dialog sits inside the stage; keep the submit from reaching anything outside it.
    event.stopPropagation()
    void form.handleSubmit((document) => onSave({ ...document, number: storedNumber(document) }))(event)
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="grid gap-5">
        <fieldset disabled={readOnly} className="grid min-w-0 gap-5">
          <SelectField
            name="docTypeId"
            label="Document Type"
            required
            options={docTypes}
            onValueChange={handleTypeChange}
            className="max-w-sm"
          />

          {meta && (
            <>
              <CheckboxGroupField
                name="categories"
                label="This document is used as"
                required
                options={categories}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {meta.hasNumber && (
                  <TextField
                    name="number"
                    label="Document Number"
                    required
                    maxLength={docTypeId === DOC_TYPE.PAN ? 10 : docTypeId === DOC_TYPE.AADHAAR ? 14 : 100}
                    transform={numberFilter}
                    description={
                      docTypeId === DOC_TYPE.AADHAAR ? 'Only the last 4 digits are kept' : undefined
                    }
                  />
                )}
                {meta.hasPlace && <TextField name="place" label="Place of Issue" required maxLength={100} />}
                {meta.hasIssueDate && (
                  <DateField name="validFrom" label="Valid From" required max={todayIso()} />
                )}
                {meta.hasExpiryDate && (
                  <DateField name="validTo" label="Valid To" required min={shiftedIso({ days: 1 })} />
                )}
              </div>
            </>
          )}

          <FileUpload
            name="file"
            label="Document file"
            required
            onUpload={uploadHandler('proof', journey)}
            onView={viewDocument}
            className="max-w-md"
          />
        </fieldset>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && <Button type="submit">{initial ? 'Update Document' : 'Add Document'}</Button>}
        </div>
      </form>
    </FormProvider>
  )
}
