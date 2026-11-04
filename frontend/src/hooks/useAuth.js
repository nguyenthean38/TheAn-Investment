import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api'
import { tokenStore } from '@/api/http'
import { qk } from './queryClient'

/** Người dùng hiện tại (null nếu chưa đăng nhập). */
export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: () => (tokenStore.get() ? authApi.me().catch(() => null) : null),
    staleTime: Infinity,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ email, name, demo }) => (demo ? authApi.demo() : authApi.verify(email, name)),
    onSuccess: ({ token, user }) => {
      tokenStore.set(token)
      qc.clear()
      qc.setQueryData(qk.me, user)
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.logout().catch(() => null),
    onSettled: () => {
      tokenStore.clear()
      qc.clear()
      qc.setQueryData(qk.me, null)
    },
  })
}

export function useUpdateMe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: authApi.updateMe,
    onMutate: async (patch) => {
      const prev = qc.getQueryData(qk.me)
      if (prev) qc.setQueryData(qk.me, { ...prev, ...patch, preferences: { ...prev.preferences, ...patch.preferences } })
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.me, ctx.prev),
    onSuccess: (user) => qc.setQueryData(qk.me, user),
  })
}

/** Tuỳ chọn hiển thị của người dùng (có giá trị mặc định khi chưa đăng nhập). */
export function usePreferences() {
  const { data } = useMe()
  return { hideHints: false, hideDock: false, newsletter: true, priceUnit: 'dong', ...(data?.preferences ?? {}) }
}
