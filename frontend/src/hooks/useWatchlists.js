import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { watchlistApi, holdingApi } from '@/api'
import { useUI } from '@/store/ui'
import { qk } from './queryClient'
import { useMe } from './useAuth'

export function useWatchlists() {
  const { data: me } = useMe()
  return useQuery({ queryKey: qk.watchlists, queryFn: watchlistApi.list, enabled: !!me })
}

/** Tập hợp mọi mã đang theo dõi (để tô sáng nút bookmark). */
export function useWatchedSet() {
  const { data } = useWatchlists()
  return new Set((data ?? []).flatMap((l) => l.tickers))
}

function useListMutation(fn, { success } = {}) {
  const qc = useQueryClient()
  const toast = useUI((s) => s.toast)
  return useMutation({
    mutationFn: fn,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: qk.watchlists })
      const msg = typeof success === 'function' ? success(vars) : success
      if (msg) toast(msg, 'success')
    },
    onError: (e) => toast(e.message, 'error'),
  })
}

export const useCreateWatchlist = () => useListMutation(({ name, tickers }) => watchlistApi.create(name, tickers), { success: (v) => `Đã tạo danh sách "${v.name}".` })
export const useUpdateWatchlist = () => useListMutation(({ id, ...patch }) => watchlistApi.update(id, patch))
export const useDeleteWatchlist = () => useListMutation((id) => watchlistApi.remove(id), { success: 'Đã xoá danh sách.' })

/** Bật/tắt theo dõi một mã: thêm vào danh sách đầu tiên hoặc gỡ khỏi mọi danh sách. */
export function useToggleWatch() {
  const qc = useQueryClient()
  const toast = useUI((s) => s.toast)
  const { data: lists } = useWatchlists()
  return useMutation({
    mutationFn: async (ticker) => {
      const containing = (lists ?? []).filter((l) => l.tickers.includes(ticker))
      if (containing.length) {
        await Promise.all(containing.map((l) => watchlistApi.removeItem(l.id, ticker)))
        return { ticker, added: false }
      }
      let target = lists?.[0]
      if (!target) target = await watchlistApi.create('Cổ phiếu theo dõi', [])
      await watchlistApi.addItem(target.id, ticker)
      return { ticker, added: true, list: target.name }
    },
    onMutate: async (ticker) => {
      await qc.cancelQueries({ queryKey: qk.watchlists })
      const prev = qc.getQueryData(qk.watchlists)
      if (prev) {
        const has = prev.some((l) => l.tickers.includes(ticker))
        qc.setQueryData(
          qk.watchlists,
          prev.map((l, i) => (has ? { ...l, tickers: l.tickers.filter((t) => t !== ticker) } : i === 0 ? { ...l, tickers: [...l.tickers, ticker] } : l)),
        )
      }
      return { prev }
    },
    onError: (e, _t, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.watchlists, ctx.prev)
      toast(e.message, 'error')
    },
    onSuccess: (r) => toast(r.added ? `Đã thêm ${r.ticker} vào "${r.list}".` : `Đã bỏ theo dõi ${r.ticker}.`, 'success'),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.watchlists }),
  })
}

/* ---- Danh mục nắm giữ ---- */
export function useHoldings() {
  const { data: me } = useMe()
  return useQuery({ queryKey: qk.holdings, queryFn: holdingApi.list, enabled: !!me })
}
function useHoldingMutation(fn, success) {
  const qc = useQueryClient()
  const toast = useUI((s) => s.toast)
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.holdings })
      if (success) toast(success, 'success')
    },
  })
}
export const useAddHolding = () => useHoldingMutation(holdingApi.create, 'Đã thêm vị thế vào danh mục.')
export const useUpdateHolding = () => useHoldingMutation(({ id, ...b }) => holdingApi.update(id, b), 'Đã cập nhật vị thế.')
export const useDeleteHolding = () => useHoldingMutation(holdingApi.remove, 'Đã xoá vị thế.')
