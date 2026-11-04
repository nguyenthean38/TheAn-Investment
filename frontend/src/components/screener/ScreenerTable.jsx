import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowDownRight, ArrowUp, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { ChangePill, TickerCell } from '@/components/ui'
import { formatBillion, formatPercent, formatPrice, formatRatio, formatVolume } from '@/utils/format'
import { cn } from '@/utils/cn'

const EXCHANGE_TONE = { HOSE: 'text-dim', HNX: 'text-info', UPCOM: 'text-ceil' }

/** Định nghĩa cột: key = trường sắp xếp. */
export const COLUMNS = [
  { key: 'ticker', label: 'Mã', align: 'left', sticky: true, render: (s) => <TickerCell ticker={s.ticker} name={s.name} color={s.color} link={false} /> },
  {
    key: 'exchange',
    label: 'Sàn',
    align: 'left',
    render: (s) => <span className={cn('rounded-md border border-line-strong bg-overlay px-1.5 py-0.5 text-[11px] font-semibold', EXCHANGE_TONE[s.exchange])}>{s.exchange}</span>,
  },
  { key: 'sectorName', label: 'Ngành', align: 'left', render: (s) => <span className="whitespace-nowrap text-dim">{s.sectorName}</span> },
  {
    key: 'epsGrowth',
    label: 'Tăng trưởng EPS',
    render: (s) => {
      const Icon = s.epsGrowth >= 0 ? ArrowUpRight : ArrowDownRight
      return (
        <span className={cn('num inline-flex items-center gap-1 font-medium', s.epsGrowth >= 0 ? 'text-up' : 'text-down')}>
          <Icon className="size-3.5" aria-hidden />
          {formatPercent(s.epsGrowth, { digits: 1 })}
        </span>
      )
    },
  },
  { key: 'marketCap', label: 'Vốn hoá', render: (s) => formatBillion(s.marketCap) },
  { key: 'pe', label: 'P/E', render: (s) => formatRatio(s.pe) },
  { key: 'pb', label: 'P/B', render: (s) => formatRatio(s.pb, 2) },
  { key: 'roe', label: 'ROE', render: (s) => formatPercent(s.roe, { sign: false, digits: 1 }) },
  {
    key: 'dividendYield',
    label: 'Cổ tức',
    render: (s) => (s.dividendYield ? <span className="text-brand">{formatPercent(s.dividendYield, { sign: false, digits: 1 })}</span> : <span className="text-faint">—</span>),
  },
  { key: 'avgVolume', label: 'KL TB 20 phiên', render: (s) => formatVolume(s.avgVolume) },
  { key: 'perf1Y', label: 'Hiệu suất 1 năm', render: (s) => <ChangePill value={s.perf1Y} digits={1} /> },
  {
    key: 'changePct',
    label: 'Giá & biến động',
    render: (s) => (
      <span className="inline-flex items-center justify-end gap-2.5">
        <span className="num font-semibold text-fg">{formatPrice(s.price)}</span>
        <ChangePill value={s.changePct} />
      </span>
    ),
  },
]

/** Bảng kết quả: tiêu đề dính, cuộn ngang, sắp xếp theo cột. */
export function ScreenerTable({ rows, sort, onSort }) {
  const navigate = useNavigate()
  const scrollRef = useRef(null)
  const page = (dir) => scrollRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' })

  return (
    <div className="card relative overflow-hidden">
      <div className="absolute top-2.5 right-3 z-20 hidden gap-1 md:flex">
        <button type="button" onClick={() => page(-1)} aria-label="Cột trước" className="rounded-lg border border-line-strong bg-raised p-1 text-muted hover:text-fg">
          <ChevronLeft className="size-4" />
        </button>
        <button type="button" onClick={() => page(1)} aria-label="Cột sau" className="rounded-lg border border-line-strong bg-raised p-1 text-muted hover:text-fg">
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div ref={scrollRef} className="max-h-[calc(100dvh-260px)] min-h-[320px] overflow-auto">
        <table className="w-full min-w-[1180px] border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              {COLUMNS.map((c) => {
                const active = sort.key === c.key
                const Arrow = sort.dir === 'asc' ? ArrowUp : ArrowDown
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className={cn(
                      'sticky top-0 z-10 border-b border-line bg-surface/95 px-4 py-3 font-medium whitespace-nowrap text-muted backdrop-blur',
                      c.align === 'left' ? 'text-left' : 'text-right',
                      c.sticky && 'left-0 z-20',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(c.key)}
                      className={cn('relative inline-flex items-center gap-1 pb-0.5 transition-colors hover:text-fg', active && 'text-fg')}
                    >
                      {c.label}
                      {active && <Arrow className="size-3" aria-hidden />}
                      {active && <span className="absolute inset-x-0 -bottom-[13px] h-0.5 rounded-full bg-brand" />}
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr
                key={s.ticker}
                tabIndex={0}
                onClick={() => navigate(`/app/co-phieu/${s.ticker}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/app/co-phieu/${s.ticker}`)}
                className="group cursor-pointer outline-none"
              >
                {COLUMNS.map((c, i) => (
                  <td
                    key={c.key}
                    className={cn(
                      'num border-b border-line px-4 py-3 whitespace-nowrap transition-colors group-hover:bg-raised group-focus-visible:bg-raised',
                      c.align === 'left' ? 'text-left' : 'text-right',
                      c.sticky && 'sticky left-0 z-[1] bg-surface',
                      i === 0 && 'group-hover:shadow-[inset_2px_0_0_var(--color-brand)]',
                    )}
                  >
                    {c.render(s)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
