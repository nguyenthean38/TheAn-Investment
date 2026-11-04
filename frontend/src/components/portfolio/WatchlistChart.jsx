import { useState } from 'react'
import { keepPreviousData, useQueries } from '@tanstack/react-query'
import { LineChart as LineIcon } from 'lucide-react'
import { stockApi } from '@/api'
import { qk } from '@/hooks/queryClient'
import { useIndexHistory } from '@/hooks/useMarket'
import { LineChart } from '@/components/charts'
import { Card, Chip, EmptyState, Segmented, Skeleton } from '@/components/ui'
import { formatDate, formatPercent } from '@/utils/format'
import { cn } from '@/utils/cn'

const RANGES = [
  { value: '1W', label: '1T' },
  { value: '1M', label: '1TH' },
  { value: '3M', label: '3TH' },
  { value: 'YTD', label: 'YTD' },
  { value: '1Y', label: '1NĂM' },
]

/**
 * So sánh hiệu suất danh sách theo dõi (chỉ số tự tính, tỷ trọng bằng nhau) với VN-Index.
 * `lists`: các danh sách; người dùng chọn phạm vi "Tất cả" hoặc một danh sách.
 */
export function WatchlistChart({ lists }) {
  const [range, setRange] = useState('3M')
  const [scope, setScope] = useState('all')
  const scoped = scope === 'all' ? lists : lists.filter((l) => l.id === scope)
  const tickers = [...new Set(scoped.flatMap((l) => l.tickers))]

  const index = useIndexHistory('VNINDEX', range)
  const histories = useQueries({
    queries: tickers.map((t) => ({
      queryKey: qk.history(t, range),
      queryFn: () => stockApi.history(t, range),
      placeholderData: keepPreviousData,
    })),
  })
  const loading = index.isLoading || histories.some((h) => h.isLoading)

  let series = null
  let wlReturn = null
  let vnReturn = null
  if (index.data?.length && tickers.length && !loading) {
    const maps = histories
      .filter((h) => h.data?.length)
      .map((h) => {
        const first = h.data[0].value
        return new Map(h.data.map((d) => [d.t, d.value / first]))
      })
    const wl = index.data
      .map((d) => {
        const vals = maps.map((m) => m.get(d.t)).filter((v) => v != null)
        return vals.length ? { t: d.t, value: (vals.reduce((a, b) => a + b, 0) / vals.length) * 100 } : null
      })
      .filter(Boolean)
    if (wl.length > 1) {
      series = [
        { id: 'vn', label: 'VN-Index', color: '#f3f3f4', data: index.data.map((d) => ({ t: d.t, value: d.value })) },
        { id: 'wl', label: scope === 'all' ? 'Danh sách theo dõi' : scoped[0]?.name, color: '#ffa36c', data: wl, area: true, width: 2 },
      ]
      wlReturn = (wl[wl.length - 1].value / wl[0].value - 1) * 100
      vnReturn = (index.data[index.data.length - 1].value / index.data[0].value - 1) * 100
    }
  }
  const beat = wlReturn != null && wlReturn >= vnReturn

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="ds-h3">Danh sách theo dõi so với thị trường</h2>
          {wlReturn != null ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>
                Danh sách <span className={cn('num font-semibold', wlReturn >= 0 ? 'text-up' : 'text-down')}>{formatPercent(wlReturn)}</span>
              </span>
              <span>
                VN-Index <span className={cn('num font-semibold', vnReturn >= 0 ? 'text-up' : 'text-down')}>{formatPercent(vnReturn)}</span>
              </span>
              <Chip tone={beat ? 'up' : 'down'}>{beat ? 'Vượt thị trường' : 'Kém thị trường'}</Chip>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">Chỉ số tự tính với tỷ trọng bằng nhau giữa các mã.</p>
          )}
        </div>
        <Segmented size="sm" options={RANGES} value={range} onChange={setRange} ariaLabel="Khung thời gian" />
      </div>

      {lists.length > 1 && (
        <div className="mb-4 flex gap-1.5 overflow-x-auto scrollbar-none">
          {[{ id: 'all', name: 'Tất cả' }, ...lists].map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={scope === l.id}
              onClick={() => setScope(l.id)}
              className={cn(
                'h-7 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors',
                scope === l.id ? 'border-line-strong bg-overlay text-fg' : 'border-line text-muted hover:text-fg',
              )}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}

      {!tickers.length ? (
        <EmptyState icon={LineIcon} title="Chưa có mã để so sánh" description="Thêm mã vào danh sách để xem hiệu suất so với VN-Index." className="py-16" />
      ) : series ? (
        <LineChart
          series={series}
          height={300}
          normalize
          xFormat={(t) => (range === '1W' ? formatDate(t, { weekday: 'short', day: '2-digit', month: '2-digit' }) : formatDate(t, { day: '2-digit', month: '2-digit', year: '2-digit' }))}
          tooltipTitle={(t) => formatDate(t)}
        />
      ) : (
        <Skeleton className="h-[300px]" />
      )}
    </Card>
  )
}
