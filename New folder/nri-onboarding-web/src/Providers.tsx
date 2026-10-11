import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from 'react'
import { Provider as StoreProvider } from 'react-redux'
import { queryClient, setUnauthorizedHandler } from '@/api'
import { DialogHost } from '@/components/shared/DialogHost'
import { Toaster } from '@/components/ui/sonner'
import { AUTH_QUERY_KEYS } from '@/features/auth'
import { store } from '@/store/store'

// A 401 from any call marks the session as anonymous; <ProtectedRoute /> then redirects to /login.
setUnauthorizedHandler(() => queryClient.setQueryData(AUTH_QUERY_KEYS.CURRENT_USER, null))

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
        <DialogHost />
        <Toaster richColors position="top-right" />
        {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
      </QueryClientProvider>
    </StoreProvider>
  )
}
