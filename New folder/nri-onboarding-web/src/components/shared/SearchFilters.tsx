import { useEffect, type ReactNode } from 'react'
import { FormProvider, useForm, type DefaultValues, type FieldValues, type Resolver } from 'react-hook-form'
import { Button } from '@/components/ui/button'

interface SearchFiltersProps<T extends FieldValues> {
  /** The filters currently applied (usually read from the URL). */
  values: T
  /** Filters with nothing set, used by Reset. */
  emptyValues: T
  onSearch: (values: T) => void
  isSearching?: boolean
  /** Cross-field rules checked before a search runs. */
  resolver?: Resolver<T>
  /** Form-bound fields (`TextField`, `DateField`, `SelectField`…) named after keys of `values`. */
  children: ReactNode
}

/** Filter bar shared by the list and report screens: a grid of fields with Search and Reset. */
export function SearchFilters<T extends FieldValues>({
  values,
  emptyValues,
  onSearch,
  isSearching,
  resolver,
  children,
}: SearchFiltersProps<T>) {
  const form = useForm<T>({ defaultValues: values as DefaultValues<T>, resolver })

  // Browser back / forward changes the applied filters without touching the inputs.
  useEffect(() => form.reset(values), [form, values])

  return (
    <FormProvider {...form}>
      <form
        role="search"
        onSubmit={form.handleSubmit(onSearch)}
        className="grid gap-4 rounded-xl border bg-card p-4 shadow-xs sm:p-5"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSearching}>
            {isSearching ? 'Searching…' : 'Search'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset(emptyValues)
              onSearch(emptyValues)
            }}
          >
            Reset
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
