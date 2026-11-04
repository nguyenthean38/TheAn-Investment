import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, Chip, ErrorState, SectionHeader, Skeleton, TickMeter, TickerCell, TickerLogo } from '@/components/ui'
import { useMarketInsiders } from '@/hooks/useMarket'
import { formatDate, formatNumber, formatPrice, formatValueVnd } from '@/utils/format'
import { cn } from '@/utils/cn'

export function TradeChip({ type }) {
  return <Chip tone={type === 'buy' ? 'up' : 'down'}>{type === 'buy' ? 'Mua' : 'Bán'}</Chip>
}

/** Bảng giao dịch nội bộ (mua hoặc bán). */
function InsiderTable({ title, rows }) {
  return (
    <Card className="p-5 sm:p-6">
      <SectionHeader title={title} subtitle={`${rows.length} giao dịch gần nhất`} />
      <div className="-mx-5 overflow-x-auto sm:-mx-6">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="py-2.5 pr-3 pl-5 font-medium sm:pl-6">Mã</th>
              <th className="px-3 py-2.5 font-medium">Người giao dịch</th>
              <th className="px-3 py-2.5 font-medium">Ngày</th>
              <th className="px-3 py-2.5 text-right font-medium">Giá</th>
              <th className="px-3 py-2.5 text-right font-medium">KL đăng ký / thực hiện</th>
              <th className="px-3 py-2.5 text-right font-medium">Giá trị</th>
              <th className="py-2.5 pr-5 pl-3 text-right font-medium sm:pr-6">Loại</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-muted">
                  Chưa có giao dịch.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const partial = r.executed < r.registered
              return (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-raised/40">
                  <td className="py-3 pr-3 pl-5 sm:pl-6">
                    <TickerCell ticker={r.ticker} name={r.company} color={r.color} size={30} className="max-w-[220px]" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted">{r.role}</div>
                  </td>
                  <td className="num px-3 py-3 whitespace-nowrap text-dim">{formatDate(r.date)}</td>
                  <td className="num px-3 py-3 text-right">{formatPrice(r.price)}</td>
                  <td className="num px-3 py-3 text-right whitespace-nowrap">
                    <span className="text-muted">{formatNumber(r.registered)}</span>
                    <span className="text-faint"> / </span>
                    <span className={cn(partial ? 'text-ref' : 'text-fg')}>{formatNumber(r.executed)}</span>
                  </td>
                  <td className={cn('num px-3 py-3 text-right font-medium', r.type === 'buy' ? 'text-up' : 'text-down')}>{formatValueVnd(r.value)}</td>
                  <td className="py-3 pr-5 pl-3 text-right sm:pr-6">
                    <TradeChip type={r.type} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function InsidersTab() {
  const { data, isLoading, error, refetch } = useMarketInsiders({ limit: 60 })
  const stats = useMemo(() => {
    const list = data ?? []
    const buys = list.filter((x) => x.type === 'buy')
    const sells = list.filter((x) => x.type === 'sell')
    const sum = (a) => a.reduce((s, x) => s + x.value, 0)
    return { buys, sells, buyValue: sum(buys), sellValue: sum(sells), large: [...list].sort((a, b) => b.value - a.value).slice(0, 5) }
  }, [data])

  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (isLoading)
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-[18px]" />
          <Skeleton className="h-72 rounded-[18px]" />
        </div>
        <Skeleton className="h-96 rounded-[18px]" />
      </div>
    )

  const total = stats.buyValue + stats.sellValue || 1
  const net = stats.buyValue - stats.sellValue
  const max = Math.max(stats.buyValue, stats.sellValue) || 1

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-6">
          <SectionHeader title="Giao dịch lớn" subtitle="5 giao dịch có giá trị cao nhất gần đây" />
          <ul className="divide-y divide-line">
            {stats.large.map((r) => (
              <li key={r.id}>
                <Link to={`/app/co-phieu/${r.ticker}`} className="flex items-center gap-3 py-3 transition-opacity hover:opacity-85">
                  <TickerLogo ticker={r.ticker} color={r.color} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{r.ticker}</span>
                    <span className="block truncate text-xs text-muted">
                      {r.name} · {r.role}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className={cn('num block text-sm font-semibold', r.type === 'buy' ? 'text-up' : 'text-down')}>{formatValueVnd(r.value)}</span>
                    <span className="num block text-[11px] text-faint">{formatDate(r.date)}</span>
                  </span>
                  <TradeChip type={r.type} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeader title="Mua và bán" subtitle={`Tổng hợp ${data.length} giao dịch nội bộ gần nhất`} />
          <div className={cn('num text-3xl font-bold tracking-tight', net >= 0 ? 'text-up' : 'text-down')}>
            {net >= 0 ? '+' : '-'}
            {formatValueVnd(Math.abs(net))}
          </div>
          <p className="mt-1 text-sm text-muted">{net >= 0 ? 'Người nội bộ đang gom thêm cổ phiếu' : 'Người nội bộ đang chốt lời / giảm sở hữu'}</p>

          <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-overlay">
            <span className="bg-up" style={{ width: `${(stats.buyValue / total) * 100}%` }} />
            <span className="bg-down" style={{ width: `${(stats.sellValue / total) * 100}%` }} />
          </div>

          <div className="mt-6 space-y-5">
            {[
              ['Mua vào', stats.buys.length, stats.buyValue, 'text-up', 1],
              ['Bán ra', stats.sells.length, stats.sellValue, 'text-down', -1],
            ].map(([label, count, value, tone, sign]) => (
              <div key={label}>
                <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-dim">
                    {label} <span className="text-faint">· {count} giao dịch</span>
                  </span>
                  <span className={cn('num font-semibold', tone)}>{formatValueVnd(value)}</span>
                </div>
                <TickMeter value={sign * value} max={max} ticks={40} centered={false} className="w-full justify-between" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <InsiderTable title="Mua gần đây" rows={stats.buys.slice(0, 15)} />
      <InsiderTable title="Bán gần đây" rows={stats.sells.slice(0, 15)} />
    </div>
  )
}
