import {
  Blocks,
  ChartColumn,
  ChartNoAxesCombined,
  ClipboardList,
  Columns3,
  FileBarChart,
  FilePlus2,
  FileSearch,
  FileUp,
  Hourglass,
  LayoutDashboard,
  LayoutGrid,
  LayoutPanelLeft,
  MessageSquareWarning,
  PackageCheck,
  ScanFace,
  Truck,
  UserPlus,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export interface MenuItem {
  label: string
  to: string
  icon: LucideIcon
}

export interface MenuGroup {
  label: string
  icon: LucideIcon
  to?: string
  items?: MenuItem[]
}

// Same menu as the MVC sidebar (Docs/UI/00-Common-Layout.md §2).
export const MENU: MenuGroup[] = [
  {
    label: 'Dashboards',
    icon: LayoutDashboard,
    items: [
      { label: 'Pipeline', to: '/', icon: Workflow },
      { label: 'Overview', to: '/dashboard/overview', icon: LayoutGrid },
      { label: 'Analytics', to: '/dashboard/analytics', icon: ChartNoAxesCombined },
      { label: 'Work Board', to: '/dashboard/board', icon: Columns3 },
      { label: 'Bento', to: '/dashboard/bento', icon: LayoutPanelLeft },
    ],
  },
  {
    label: 'Account Opening',
    icon: FilePlus2,
    items: [
      { label: 'Add New Account', to: '/journey', icon: UserPlus },
      { label: 'Data Objection', to: '/objections', icon: MessageSquareWarning },
      { label: 'PDF Upload', to: '/pdf-upload', icon: FileUp },
      { label: 'Inprocess Forms', to: '/reports/in-process', icon: Hourglass },
      { label: 'Allocated Forms', to: '/allocated-forms', icon: ClipboardList },
      { label: 'Send Liveliness Link', to: '/liveliness/send', icon: ScanFace },
    ],
  },
  {
    label: 'Reports',
    icon: FileBarChart,
    items: [
      { label: 'MIS Reports', to: '/reports/mis', icon: ChartColumn },
      { label: 'Account Status Report', to: '/reports/account-status', icon: FileSearch },
    ],
  },
  {
    label: 'Courier',
    icon: Truck,
    items: [{ label: 'Courier Details', to: '/courier', icon: PackageCheck }],
  },
]

// Dev-only reference page for the shared components.
if (import.meta.env.DEV) MENU.push({ label: 'Component Kit', icon: Blocks, to: '/kit' })

const isUnder = (pathname: string, to: string) =>
  to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)

/** The menu entry the current URL belongs to, for the top bar title. */
export function findMenuEntry(pathname: string): { section?: string; label: string } | null {
  for (const group of MENU) {
    if (group.to && isUnder(pathname, group.to)) return { label: group.label }
    const item = group.items?.find((entry) => isUnder(pathname, entry.to))
    if (item) return { section: group.label, label: item.label }
  }
  return null
}

export const isGroupActive = (group: MenuGroup, pathname: string) =>
  group.items?.some((item) => isUnder(pathname, item.to)) ?? false
