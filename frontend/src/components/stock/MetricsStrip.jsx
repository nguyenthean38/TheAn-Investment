import { Metric } from '@/components/ui'
import { formatBillion, formatPercent, formatPrice, formatRatio } from '@/utils/format'

/** Dải 10 chỉ số định giá & hiệu quả. */
export function MetricsStrip({ stock }) {
  const items = [
    ['Vốn hoá', formatBillion(stock.marketCap)],
    ['P/E', formatRatio(stock.pe)],
    ['P/B', formatRatio(stock.pb, 2)],
    ['EPS (4 quý)', `${formatPrice(stock.eps)}đ`],
    ['ROE', formatPercent(stock.roe, { sign: false, digits: 1 })],
    ['Biên LN gộp', formatPercent(stock.grossMargin, { sign: false, digits: 1 })],
    ['Biên LN ròng', formatPercent(stock.netMargin, { sign: false, digits: 1 })],
    ['Beta', formatRatio(stock.beta, 2)],
    ['Tỷ suất cổ tức', formatPercent(stock.dividendYield, { sign: false })],
  ]
  const own = stock.foreignOwnership
  const room = stock.foreignRoom
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-5 xl:grid-cols-10">
      {items.map(([label, value]) => (
        <div key={label} className="bg-surface px-4 py-3.5">
          <Metric label={label} value={value} />
        </div>
      ))}
      <div className="bg-surface px-4 py-3.5">
        <Metric
          label="Sở hữu nước ngoài"
          value={formatPercent(own, { sign: false, digits: 1 })}
          sub={
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-1 w-full max-w-16 overflow-hidden rounded-full bg-overlay">
                <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (own / room) * 100)}%` }} />
              </span>
              room {room}%
            </span>
          }
        />
      </div>
    </div>
  )
}
