import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './error'

const isClientError = (error: unknown) =>
  error instanceof ApiError && error.status !== undefined && error.status >= 400 && error.status < 500

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => !isClientError(error) && failureCount < 2,
    },
    mutations: { retry: false },
  },
})

/** Master data does not change within a session. */
export const MASTER_QUERY_OPTIONS = { staleTime: Infinity, gcTime: Infinity } as const
