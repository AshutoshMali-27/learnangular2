import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FormProvider, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { getErrorMessage, MASTER_QUERY_OPTIONS } from '@/api'
import { SelectField } from '@/components/form'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageLoader } from '@/components/shared/PageLoader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { journeyPath } from '@/features/journey/stages.config'
import { ALLOCATED_FORMS_QUERY_KEYS, allocatedFormsService } from '../services'

const schema = z.object({ versionId: z.string().min(1, 'Please select a form version') })
type Values = z.infer<typeof schema>

/** Generate a form number for the branch and see the numbers that are allocated but unused. */
export default function AllocatedForms() {
  const queryClient = useQueryClient()
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { versionId: '' } })

  const versions = useQuery({
    queryKey: ALLOCATED_FORMS_QUERY_KEYS.VERSIONS,
    queryFn: allocatedFormsService.getVersions,
    ...MASTER_QUERY_OPTIONS,
  })
  const available = useQuery({
    queryKey: ALLOCATED_FORMS_QUERY_KEYS.AVAILABLE,
    queryFn: allocatedFormsService.getAvailable,
  })

  const generate = useMutation({
    mutationFn: ({ versionId }: Values) => allocatedFormsService.generate(versionId),
    // The new number belongs in the available list straight away.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ALLOCATED_FORMS_QUERY_KEYS.AVAILABLE }),
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Allocated Forms"
        description="A form number is needed before an account opening can start."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <h2>Generate form number</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormProvider {...form}>
              <form
                onSubmit={form.handleSubmit((values) => generate.mutate(values))}
                className="flex flex-wrap items-start gap-2"
                noValidate
              >
                <SelectField
                  name="versionId"
                  label="Form Version"
                  required
                  options={versions.data}
                  isLoading={versions.isPending}
                  className="min-w-0 flex-1 sm:max-w-xs"
                />
                <div className="pt-[1.375rem]">
                  <Button type="submit" disabled={generate.isPending}>
                    {generate.isPending ? 'Generating…' : 'Generate'}
                  </Button>
                </div>
              </form>
            </FormProvider>

            {generate.data && (
              <div role="status" className="grid gap-2 rounded-md bg-muted p-4">
                <p className="text-sm text-muted-foreground">Form number generated successfully</p>
                <p className="text-2xl font-semibold tracking-wide">{generate.data.formNo}</p>
                <div>
                  <Button asChild size="sm">
                    <Link to={journeyPath(generate.data.formNo)}>Start onboarding with this number</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <h2>Available form numbers</h2>
            </CardTitle>
            <CardDescription>Allocated to your branch and not used yet. Choose one to start.</CardDescription>
          </CardHeader>
          <CardContent>
            {available.isPending ? (
              <PageLoader />
            ) : available.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {getErrorMessage(available.error)}
              </p>
            ) : available.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No unused form numbers. Generate one to continue.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {available.data.map((formNo) => (
                  <li key={formNo}>
                    <Button asChild variant="outline" size="sm">
                      <Link to={journeyPath(formNo)}>{formNo}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
