import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Star } from 'lucide-react'
import { Button, ChangePill, Drawer, EmptyState, Segmented, Skeleton, TickerLogo } from '@/components/ui'
import { useStocks } from '@/hooks/useMarket'
import { useWatchlists } from '@/hooks/useWatchlists'
import { useUI } from '@/store/ui'
import { formatPrice, formatChange } from '@/utils/format'
import { cn } from '@/utils/cn'

const RANGE_FIELD = { '1D': 'changePct', '1W': 'perf1W', '1M': 'perf1M', '3M': 'perf3M', '1Y': 'perf1Y' }
const RANGE_LABEL = { '1D': 'trong ngày', '1W': '1 tuần', '1M': '1 tháng', '3M': '3 tháng', '1Y': '1 năm' }

/** Ngăn danh sách theo dõi nhanh (phím W), mở được ở mọi trang. */
export function WatchPanel() {
  const open = useUI((s) => s.watchPanelOpen)
  const setOpen = useUI((s) => s.setWatchPanelOpen)
  const { data: lists, isLoading } = useWatchlists()
  const { data: stocks = [] } = useStocks()
  const [range, setRange] = useState('1D')
  const byTicker = useMemo(() => new Map(stocks.map((s) => [s.ticker, s])), [stocks])
  const close = () => setOpen(false)

  return (
    <Drawer
      open={open}
      onClose={close}
      title={
        <span className="inline-flex items-center gap-2">
          <Star className="size-4 text-brand" /> Danh sách theo dõi
        </span>
      }
      footer={
        <Button to="/app/danh-muc" variant="secondary" className="w-full" onClick={close}>
          Quản lý danh mục <ArrowUpRight className="size-4" />
        </Button>
      }
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-canvas/95 px-5 py-3 backdrop-blur">
        <span className="text-xs text-muted">Lợi nhuận {RANGE_LABEL[range]}</span>
        <Segmented size="sm" value={range} onChange={setRange} options={[{ value: '1D', label: '1N' }, { value: '1W', label: '1T' }, { value: '1M', label: '1TH' }, { value: '3M', label: '3TH' }, { value: '1Y', label: '1NĂM' }]} />
      </div>
      {isLoading && (
        <div className="space-y-3 p-5">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      )}
      {lists?.every((l) => !l.tickers.length) && (
        <EmptyState icon={Star} title="Chưa theo dõi mã nào" description="Bấm biểu tượng ngôi sao ở trang cổ phiếu hoặc nhấn B để thêm vào danh sách." />
      )}
      {lists?.map((l) =>
        l.tickers.length ? (
          <section key={l.id} className="px-3 pt-4">
            <h3 className="ds-label px-2 pb-1.5">{l.name}</h3>
            {l.tickers.map((t) => {
              const s = byTicker.get(t)
              if (!s) return null
              const v = s[RANGE_FIELD[range]]
              return (
                <Link key={t} to={`/app/co-phieu/${t}`} onClick={close} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-raised">
                  <TickerLogo ticker={t} color={s.color} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{t}</span>
                    <span className="block truncate text-xs text-muted">{s.name}</span>
                  </span>
                  <span className="text-right">
                    <span className="num block text-sm font-medium">{formatPrice(s.price)}</span>
                    <span className={cn('num block text-[11px]', s.change >= 0 ? 'text-up' : 'text-down')}>{formatChange(s.change)}</span>
                  </span>
                  <ChangePill value={v} />
                </Link>
              )
            })}
          </section>
        ) : null,
      )}
    </Drawer>
  )
}
