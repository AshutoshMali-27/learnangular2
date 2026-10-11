import { Check, Moon, Palette, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { modeSet, THEMES, themeSet, type ColorMode } from '@/store/slices/uiSlice'

const MODES: { id: ColorMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
]

/** Palette button: picks the brand theme and light / dark mode. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const dispatch = useAppDispatch()
  const { theme, mode } = useAppSelector((state) => state.ui)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-lg" aria-label="Change theme" className={className}>
          <Palette />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-1.5rem)] gap-3 p-3">
        <div className="grid grid-cols-2 gap-1.5">
          <p className="col-span-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Theme</p>
          {THEMES.map(({ id, label, hint, swatch }) => (
            <button
              key={id}
              type="button"
              aria-pressed={theme === id}
              onClick={() => dispatch(themeSet(id))}
              className={cn(
                'relative flex items-center gap-2 rounded-lg border p-2 text-left transition-colors hover:bg-muted',
                theme === id && 'border-primary bg-primary/5',
              )}
            >
              <span
                aria-hidden
                className="size-7 shrink-0 rounded-md shadow-inner"
                style={{ background: `linear-gradient(135deg, ${swatch[0]} 0 60%, ${swatch[1]} 60% 100%)` }}
              />
              <span className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-sm font-medium">{label}</span>
                <span className="truncate text-xs text-muted-foreground">{hint}</span>
              </span>
              {theme === id && (
                <span className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" />
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid gap-1.5">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Mode</p>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={mode === id}
                onClick={() => dispatch(modeSet(id))}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm text-muted-foreground transition-colors',
                  mode === id && 'bg-card font-medium text-foreground shadow-sm',
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
