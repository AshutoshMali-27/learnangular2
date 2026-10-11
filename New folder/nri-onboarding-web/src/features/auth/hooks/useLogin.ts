import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../auth.services'
import { AUTH_QUERY_KEYS } from '../queryKeys'

/** Step 1: credentials. Success means the OTP has been sent. */
export const useLogin = () => useMutation({ mutationFn: authService.login })

/** Step 2: OTP. Success means the session exists, so the current user is refetched. */
export const useVerifyOtp = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.verifyOtp,
    onSuccess: () => queryClient.refetchQueries({ queryKey: AUTH_QUERY_KEYS.CURRENT_USER }),
  })
}
