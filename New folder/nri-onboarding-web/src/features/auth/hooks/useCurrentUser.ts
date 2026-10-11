import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { authService } from '../auth.services'
import { AUTH_QUERY_KEYS } from '../queryKeys'

export const currentUserQuery = queryOptions({
  queryKey: AUTH_QUERY_KEYS.CURRENT_USER,
  queryFn: authService.getCurrentUser,
  retry: false,
  staleTime: Infinity,
})

export const useCurrentUser = () => useQuery(currentUserQuery)

/** For components rendered inside <ProtectedRoute />, where a user is guaranteed. */
export const useSessionUser = () => {
  const { data } = useSuspenseQuery(currentUserQuery)
  if (!data) throw new Error('useSessionUser must be used inside a protected route.')
  return data
}
