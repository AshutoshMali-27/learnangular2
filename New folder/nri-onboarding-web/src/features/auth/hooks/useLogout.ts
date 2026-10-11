import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppDispatch } from '@/store/hooks'
import { draftsReset } from '@/store/slices/draftsSlice'
import { authService } from '../auth.services'
import { AUTH_QUERY_KEYS } from '../queryKeys'

export const useLogout = () => {
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      dispatch(draftsReset())
      // Mark the session as anonymous (ProtectedRoute reacts), then drop every other cached response.
      queryClient.setQueryData(AUTH_QUERY_KEYS.CURRENT_USER, null)
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
    },
  })
}
