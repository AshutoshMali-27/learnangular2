import logo from '@/assets/sharekhanlogo.png'
import { cn } from '@/lib/utils'

/**
 * The company logo. Its artwork is dark blue on transparent, so it always sits on a white
 * plate to stay readable on the coloured sidebar, the login panel and in dark mode.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-lg bg-white px-3 py-2 shadow-sm', className)}>
      <img src={logo} alt="Mirae Asset Sharekhan" width={422} height={61} className="h-6 w-auto" />
    </span>
  )
}
