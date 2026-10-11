import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FormProvider, useForm } from 'react-hook-form'
import { ArrowRight, FilePlus2, ListChecks, RotateCcw, ScanSearch } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { getErrorMessage } from '@/api'
import { TextField } from '@/components/form'
import { Button } from '@/components/ui/button'
import { filters } from '@/lib/validators'
import { journeyQuery } from '../hooks/useJourney'
import { currentStagePath } from '../stages.config'

const schema = z.object({ formNo: z.string().min(1, 'Form number is required') })
type Values = z.infer<typeof schema>

const HOW_IT_WORKS = [
  { icon: ScanSearch, title: 'Enter the form number', text: 'An allocated form starts fresh; a form in progress resumes where it stopped.' },
  { icon: ListChecks, title: 'Complete each stage', text: 'Inward, address, holders, FATCA, proofs, nominees and bank details.' },
  { icon: RotateCcw, title: 'Come back any time', text: 'Every stage is saved, so nothing is lost between sittings.' },
]

/** Entry point of the journey: validate a form number, then go to that form's current stage. */
export default function JourneyStart() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { formNo: '' } })

  const open = useMutation({
    mutationFn: ({ formNo }: Values) => queryClient.fetchQuery({ ...journeyQuery(formNo), staleTime: 0 }),
    onSuccess: (journey) => navigate(currentStagePath(journey.formNo, journey.progress)),
    onError: (error) => form.setError('formNo', { message: getErrorMessage(error) }),
  })

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6">
      <section className="grid content-between gap-8 rounded-2xl bg-hero p-6 shadow-sm sm:p-8">
        <div className="grid gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <FilePlus2 className="size-5" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Add New Account</h1>
          <p className="text-sm text-white/75">Start a new NRI account opening form or pick up one in progress.</p>
        </div>
        <ol className="grid gap-4">
          {HOW_IT_WORKS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
                <Icon className="size-4" />
              </span>
              <span className="grid gap-0.5">
                <span className="text-sm font-medium">{title}</span>
                <span className="text-xs text-white/70">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid content-center gap-5 rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold tracking-tight">Enter form number</h2>
          <p className="text-sm text-muted-foreground">
            Enter an allocated form number to start, or the number of a form in progress to resume it.
          </p>
        </div>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit((values) => open.mutate(values))} className="grid gap-5" noValidate>
            <TextField
              name="formNo"
              label="Form Number"
              required
              autoFocus
              placeholder="e.g. NRI000123"
              maxLength={20}
              transform={filters.upperAlnum}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="lg" className="px-4" disabled={open.isPending}>
                {open.isPending ? 'Checking…' : 'Continue'}
                <ArrowRight />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="px-4"
                disabled={open.isPending}
                onClick={() => {
                  open.reset()
                  form.reset()
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </FormProvider>
      </section>
    </div>
  )
}
