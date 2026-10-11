import { createBrowserRouter } from 'react-router-dom'
import { PageLoader } from '@/components/shared/PageLoader'
import { PendingPage } from '@/components/shared/PendingPage'
import MainLayout from '@/layout/mainLayout'
import { ProtectedRoute } from './ProtectedRoute'

// Each feature page is a lazy chunk. Screens not built yet render <PendingPage /> so the
// menu is navigable from day one; replace them with `lazy` imports as phases land.
export const router = createBrowserRouter([
  {
    path: '/login',
    lazy: async () => ({ Component: (await import('@/features/auth/pages/Login')).default }),
    HydrateFallback: PageLoader,
  },
  {
    element: <ProtectedRoute />,
    HydrateFallback: PageLoader,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/features/dashboard/pages/Dashboard')).default }),
          },
          {
            path: 'dashboard/overview',
            lazy: async () => ({ Component: (await import('@/features/dashboard/pages/OverviewDashboard')).default }),
          },
          {
            path: 'dashboard/analytics',
            lazy: async () => ({ Component: (await import('@/features/dashboard/pages/AnalyticsDashboard')).default }),
          },
          {
            path: 'dashboard/board',
            lazy: async () => ({ Component: (await import('@/features/dashboard/pages/BoardDashboard')).default }),
          },
          {
            path: 'dashboard/bento',
            lazy: async () => ({ Component: (await import('@/features/dashboard/pages/BentoDashboard')).default }),
          },
          {
            path: 'journey',
            lazy: async () => ({
              Component: (await import('@/features/journey/pages/JourneyStart')).default,
            }),
          },
          {
            path: 'journey/:formNo',
            lazy: async () => ({
              Component: (await import('@/features/journey/pages/JourneyLayout')).default,
            }),
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('@/features/journey/pages/StagePage')).JourneyIndex,
                }),
              },
              {
                path: 'complete',
                lazy: async () => ({
                  Component: (await import('@/features/journey/pages/JourneyComplete')).default,
                }),
              },
              {
                path: ':stageKey',
                lazy: async () => ({
                  Component: (await import('@/features/journey/pages/StagePage')).default,
                }),
              },
            ],
          },
          {
            path: 'objections',
            lazy: async () => ({
              Component: (await import('@/features/objections/pages/ObjectionList')).default,
            }),
          },
          {
            path: 'objections/:formNo',
            lazy: async () => ({
              Component: (await import('@/features/objections/pages/ObjectionHub')).default,
            }),
          },
          {
            path: 'objections/:formNo/:stageKey',
            lazy: async () => ({
              Component: (await import('@/features/objections/pages/ObjectionStagePage')).default,
            }),
          },
          {
            path: 'pdf-upload',
            lazy: async () => ({ Component: (await import('@/features/pdf-upload/pages/PdfUpload')).default }),
          },
          {
            path: 'allocated-forms',
            lazy: async () => ({ Component: (await import('@/features/allocated-forms/pages/AllocatedForms')).default }),
          },
          {
            path: 'liveliness/send',
            lazy: async () => ({ Component: (await import('@/features/liveliness/pages/SendLiveliness')).default }),
          },
          {
            path: 'reports/in-process',
            lazy: async () => ({ Component: (await import('@/features/reports/pages/InProcessForms')).default }),
          },
          {
            path: 'reports/mis',
            lazy: async () => ({ Component: (await import('@/features/reports/pages/MisReport')).default }),
          },
          {
            path: 'reports/account-status',
            lazy: async () => ({ Component: (await import('@/features/reports/pages/AccountStatusSearch')).default }),
          },
          {
            path: 'reports/account-status/detail',
            lazy: async () => ({ Component: (await import('@/features/reports/pages/AccountStatusDetail')).default }),
          },
          {
            path: 'courier',
            lazy: async () => ({ Component: (await import('@/features/courier/pages/Courier')).default }),
          },
          ...(import.meta.env.DEV
            ? [
                {
                  path: 'kit',
                  lazy: async () => ({
                    Component: (await import('@/features/kit/pages/KitShowcase')).default,
                  }),
                },
              ]
            : []),
          { path: '*', element: <PendingPage title="Page not found" phase={8} /> },
        ],
      },
    ],
  },
])
