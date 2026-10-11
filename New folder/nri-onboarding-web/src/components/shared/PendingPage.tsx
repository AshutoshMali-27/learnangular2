import { Construction } from 'lucide-react'

/** Placeholder for a screen scheduled in a later delivery phase. */
export function PendingPage({ title, phase }: { title: string; phase: number }) {
  return (
    <section className="grid justify-items-center gap-2 rounded-xl border border-dashed bg-card px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Construction className="size-6" />
      </span>
      <h1 className="mt-2 text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">Not built yet. Scheduled for phase {phase}.</p>
    </section>
  )
}
