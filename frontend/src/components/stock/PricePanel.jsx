import { useMemo } from 'react'
import { LineChart } from '@/components/charts'
import { ChangeText, Segmented, Skeleton, TONE_TEXT, priceTone } from '@/components/ui'
import { useStockHistory } from '@/hooks/useMarket'
import { marketSession } from '@/lib/time'
import { cn } from '@/utils/cn'
import { formatPrice, formatValueVnd, formatVolume, formatDate, trend } from '@/utils/format'
import { RANGE_OPTIONS, RANGE_TEXT, dateTick, timeTick } from './shared'

function RefCell({ label, value, className }) {
  return (
    <div className="min-w-0">
      <div className="ds-caption">{label}</div>
      <div className={cn('num mt-0.5 text-[13.5px] font-semibold', className)}>{value}</div>
    </div>
  )
}

/** Khối giá lớn + biểu đồ giá chính với khung thời gian. */
export function PricePanel({ stock, range, onRangeChange }) {
  const { data: history, isLoading, isPlaceholderData } = useStockHistory(stock.ticker, range)
  const session = marketSession()
  const tone = priceTone(stock.price, stock)

  const change = useMemo(() => {
    if (range === '1D' || !history?.length) return { change: stock.change, pct: stock.changePct }
    const first = history[0].value
    const last = history[history.length - 1].value
    return { change: last - first, pct: ((last - first) / first) * 100 }
  }, [history, range, stock])

  const lineColor = trend(change.pct) === 'down' ? '#ff5a6a' : trend(change.pct) === 'up' ? '#2fd28a' : '#f2c94c'
  const volume = useMemo(
    () => history?.map((d, i) => ({ t: d.t, value: d.volume, up: i === 0 ? d.value >= stock.ref : d.value >= history[i - 1].value })),
    [history, stock.ref],
  )

  const [main, dim] = splitPrice(stock.price)

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn('num text-[44px] leading-[1.15] font-bold tracking-tight sm:text-[52px]', TONE_TEXT[tone])}>
              {main}
              <span className="opacity-55">{dim}</span>
            </span>
            <span className="text-lg font-medium text-muted">đ</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <ChangeText change={change.change} pct={change.pct} arrow className="text-[15px]" />
            <span className="text-muted">{RANGE_TEXT[range]}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
              <span className={cn('size-1.5 rounded-full', session.open ? 'animate-pulse bg-up' : 'bg-faint')} />
              {session.label}
            </span>
          </div>
        </div>
        <Segmented options={RANGE_OPTIONS} value={range} onChange={onRangeChange} size="sm" ariaLabel="Khung thời gian" className="max-w-full overflow-x-auto scrollbar-none" />
      </div>

      <div className="mt-5 grid grid-cols-4 gap-x-4 gap-y-3 rounded-2xl border border-line bg-base/60 px-4 py-3 sm:grid-cols-8">
        <RefCell label="Tham chiếu" value={formatPrice(stock.ref)} className="text-ref" />
        <RefCell label="Trần" value={formatPrice(stock.ceil)} className="text-ceil" />
        <RefCell label="Sàn" value={formatPrice(stock.floor)} className="text-floor" />
        <RefCell label="Mở cửa" value={formatPrice(stock.open)} className={TONE_TEXT[priceTone(stock.open, stock)]} />
        <RefCell label="Cao" value={formatPrice(stock.high)} className={TONE_TEXT[priceTone(stock.high, stock)]} />
        <RefCell label="Thấp" value={formatPrice(stock.low)} className={TONE_TEXT[priceTone(stock.low, stock)]} />
        <RefCell label="Khối lượng" value={formatVolume(stock.volume)} className="text-fg" />
        <RefCell label="Giá trị GD" value={formatValueVnd(stock.value)} className="text-fg" />
      </div>

      <div className={cn('mt-5 transition-opacity', isPlaceholderData && 'opacity-60')}>
        {isLoading || !history ? (
          <Skeleton className="h-[340px]" />
        ) : (
          <LineChart
            height={340}
            series={[{ id: 'price', label: stock.ticker, color: lineColor, area: true, width: 1.8, data: history }]}
            baseline={range === '1D' ? { value: stock.ref, label: `Tham chiếu ${formatPrice(stock.ref)}` } : undefined}
            volume={volume}
            yFormat={(v) => formatPrice(v)}
            xFormat={range === '1D' ? timeTick : dateTick}
            tooltipTitle={(t) => (range === '1D' ? `${timeTick(t)} · ${formatDate(t)}` : formatDate(t, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }))}
          />
        )}
      </div>
      <p className="mt-2 text-[11.5px] text-faint">Nhấn [ hoặc ] để chuyển khung thời gian · Đường nét đứt là giá tham chiếu.</p>
    </div>
  )
}

/** Tách giá "128.400" thành phần chính "128." và phần mờ "400" (giống bảng điện, nhấn mạnh hàng nghìn). */
function splitPrice(p) {
  const s = formatPrice(p)
  const i = s.lastIndexOf('.')
  if (i < 0) return [s, '']
  return [s.slice(0, i + 1), s.slice(i + 1)]
}
