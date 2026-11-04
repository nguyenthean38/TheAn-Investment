import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountApi } from '@/api'
import { useUI } from '@/store/ui'
import { qk } from './queryClient'
import { useMe } from './useAuth'

const useAuthed = () => !!useMe().data

export const useTemplates = () => useQuery({ queryKey: qk.templates, queryFn: accountApi.templates, enabled: useAuthed() })
export const useSubscription = () => useQuery({ queryKey: qk.subscription, queryFn: accountApi.subscription, enabled: useAuthed() })
export const useReferrals = () => useQuery({ queryKey: qk.referrals, queryFn: accountApi.referrals, enabled: useAuthed() })

function useAccountMutation(fn, key, success) {
  const qc = useQueryClient()
  const toast = useUI((s) => s.toast)
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      if (key) qc.invalidateQueries({ queryKey: key })
      if (success) toast(typeof success === 'function' ? success(data) : success, 'success')
    },
  })
}

export const useSaveTemplate = () => useAccountMutation(accountApi.saveTemplate, qk.templates, 'Đã lưu mẫu bộ lọc.')
export const useDeleteTemplate = () => useAccountMutation(accountApi.deleteTemplate, qk.templates, 'Đã xoá mẫu bộ lọc.')
export const useChangePlan = () => useAccountMutation(accountApi.changePlan, qk.subscription, 'Đã cập nhật gói thành viên.')
export const useCancelSubscription = () => useAccountMutation(accountApi.cancelSubscription, qk.subscription, 'Đã huỷ gia hạn gói thành viên.')
export const useResumeSubscription = () => useAccountMutation(accountApi.resumeSubscription, qk.subscription, 'Chào mừng bạn quay lại!')
export const useSendReferrals = () => useAccountMutation(accountApi.sendReferrals, qk.referrals, (d) => `Đã gửi ${d.sent} lời mời.`)
export const useSendFeedback = () => useAccountMutation(accountApi.feedback, null, null)
