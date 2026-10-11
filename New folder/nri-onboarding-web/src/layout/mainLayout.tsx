import { ChevronRight, Landmark, LogOut, Menu as MenuIcon, Moon, PanelLeftClose, PanelLeftOpen, Sun, X } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { PageLoader } from '@/components/shared/PageLoader'
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ENV } from '@/config/environment'
import { useLogout, useSessionUser } from '@/features/auth'
import { confirm } from '@/lib/dialog-service'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { modeToggled, sidebarPinToggled } from '@/store/slices/uiSlice'
import { findMenuEntry, isGroupActive, MENU, type MenuGroup } from './menu'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors outline-none',
    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring',
    isActive &&
      'bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-sidebar-primary',
  )

const railClass = (isActive: boolean) =>
  cn(
    'relative grid size-10 place-items-center rounded-lg transition-colors outline-none',
    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring',
    isActive &&
      'bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-2 before:-left-3 before:w-1 before:rounded-full before:bg-sidebar-primary',
  )

function Brand({ collapsed }: { collapsed?: boolean }) {
  // The logo is too wide for the icon rail, which shows a plain mark instead.
  return collapsed ? (
    <span
      title="NRI Onboarding"
      className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[var(--hero-to)] shadow-sm ring-2 ring-sidebar-primary"
    >
      <Landmark className="size-5" />
    </span>
  ) : (
    <BrandLogo className="w-full justify-center" />
  )
}

/** A menu group on the collapsed rail: its icon opens a flyout with the group's screens. */
function RailGroup({ group }: { group: MenuGroup }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const Icon = group.icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" title={group.label} aria-label={group.label} className={railClass(isGroupActive(group, pathname))}>
          <Icon className="size-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={14} className="w-60 gap-1 p-2">
        <p className="px-2 py-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group.label}</p>
        {group.items?.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-muted',
                isActive && 'bg-primary/10 font-medium text-primary',
              )
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function SidebarNav({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  if (collapsed) {
    return (
      <nav className="grid justify-items-center gap-1.5" aria-label="Main">
        {MENU.map((group) =>
          group.to ? (
            <NavLink
              key={group.label}
              to={group.to}
              end
              title={group.label}
              aria-label={group.label}
              className={({ isActive }) => railClass(isActive)}
            >
              <group.icon className="size-5" />
            </NavLink>
          ) : (
            <RailGroup key={group.label} group={group} />
          ),
        )}
      </nav>
    )
  }

  return (
    <nav className="grid gap-1" aria-label="Main">
      {MENU.map(({ label, icon: Icon, to, items }) =>
        to ? (
          <NavLink key={label} to={to} end className={linkClass} onClick={onNavigate}>
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ) : (
          <div key={label} className="mt-4 grid gap-1">
            <p className="px-3 pb-1 text-[0.7rem] font-semibold tracking-widest text-sidebar-foreground/55 uppercase">
              {label}
            </p>
            {items?.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass} onClick={onNavigate}>
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ),
      )}
    </nav>
  )
}

const YEAR = new Date().getFullYear()
const SIDEBAR_SURFACE = 'bg-sidebar text-sidebar-foreground bg-gradient-to-b from-white/[0.07] to-black/20'

/** Desktop sidebar: expanded with labels, or collapsed to an icon rail. */
function DesktopSidebar() {
  const pinned = useAppSelector((state) => state.ui.sidebarPinned)

  return (
    <aside
      className={cn(
        SIDEBAR_SURFACE,
        'hidden shrink-0 flex-col border-r border-sidebar-border transition-[width] duration-200 lg:flex',
        pinned ? 'w-64' : 'w-[4.5rem]',
      )}
    >
      <div className={cn('flex h-16 shrink-0 items-center border-b border-sidebar-border', pinned ? 'px-4' : 'justify-center')}>
        <Brand collapsed={!pinned} />
      </div>
      <div className="scrollbar-slim min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3">
        <SidebarNav collapsed={!pinned} />
      </div>
      {pinned && (
        <p className="border-t border-sidebar-border px-4 py-3 text-xs text-sidebar-foreground/55">
          © {YEAR} · {ENV.INSTANCE}
        </p>
      )}
    </aside>
  )
}

/** Phone / tablet sidebar: slides in over the page. */
function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className="lg:hidden" inert={!open}>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        id="mobile-sidebar"
        className={cn(
          SIDEBAR_SURFACE,
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col shadow-2xl transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-sidebar-border px-4">
          <Brand />
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto p-3">
          <SidebarNav onNavigate={onClose} />
        </div>
      </aside>
    </div>
  )
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'

function UserMenu() {
  const user = useSessionUser()
  const logout = useLogout()

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Logout Confirmation',
      description: 'Are you sure you want to log out?',
      confirmText: 'Logout',
    })
    if (confirmed) {
      logout.mutate(undefined, { onError: (error) => toast.error(getErrorMessage(error)) })
    }
  }

  const avatar = (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
      {initials(user.empName)}
    </span>
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex items-center gap-2.5 rounded-full p-1 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 sm:pr-3"
        >
          {avatar}
          <span className="hidden max-w-40 leading-tight sm:grid">
            <span className="truncate text-sm font-medium">{user.empName}</span>
            <span className="truncate text-xs text-muted-foreground">{user.branchTypeCode}</span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-3 p-3">
        <div className="flex items-center gap-3">
          {avatar}
          <div className="grid min-w-0 leading-tight">
            <span className="truncate font-medium">{user.empName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {[user.empCode, user.branchCode, user.branchTypeCode].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>
        <Button variant="destructive" onClick={handleLogout} disabled={logout.isPending}>
          <LogOut />
          Logout
        </Button>
      </PopoverContent>
    </Popover>
  )
}

function Topbar({ mobileOpen, onOpenMobile }: { mobileOpen: boolean; onOpenMobile: () => void }) {
  const dispatch = useAppDispatch()
  const { mode, sidebarPinned } = useAppSelector((state) => state.ui)
  const { pathname } = useLocation()
  const entry = findMenuEntry(pathname)

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b bg-card/85 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div aria-hidden className="h-1 bg-brand-stripe" />
      <div className="flex h-15 items-center gap-2 px-3 sm:px-4 lg:px-6">
        {/* Phones and tablets: open the slide-in menu. */}
        <Button
          variant="ghost"
          size="icon-lg"
          className="lg:hidden"
          aria-label="Open menu"
          aria-controls="mobile-sidebar"
          aria-expanded={mobileOpen}
          onClick={onOpenMobile}
        >
          <MenuIcon />
        </Button>
        {/* Desktop: collapse the sidebar to icons, or expand it again. */}
        <Button
          variant="ghost"
          size="icon-lg"
          className="hidden lg:inline-flex"
          aria-label={sidebarPinned ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-pressed={sidebarPinned}
          onClick={() => dispatch(sidebarPinToggled())}
        >
          {sidebarPinned ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>

        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          {entry?.section && (
            <>
              <span className="hidden text-muted-foreground md:inline">{entry.section}</span>
              <ChevronRight className="hidden size-4 text-muted-foreground md:inline" />
            </>
          )}
          <span className="truncate font-semibold">{entry?.label ?? 'NRI Onboarding'}</span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => dispatch(modeToggled())}
          >
            {mode === 'dark' ? <Sun /> : <Moon />}
          </Button>
          <span aria-hidden className="mx-1 hidden h-6 w-px bg-border sm:block" />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-svh bg-background text-foreground">
      <DesktopSidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar mobileOpen={mobileOpen} onOpenMobile={() => setMobileOpen(true)} />
        <main className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[100rem] p-4 sm:p-6 lg:p-8">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
