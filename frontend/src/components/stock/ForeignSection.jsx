import { BarChart } from '@/components/charts'
import { Card, ErrorState, Metric, SectionHeader, Skeleton } from '@/components/ui'
import { useStockForeign } from '@/hooks/useMarket'
import { cn } from '@/utils/cn'
import { formatNumber, formatPercent, formatValueVnd } from '@/utils/format'

/** Mục "Khối ngoại": tỷ lệ sở hữu so với room + mua/bán ròng 30 phiên. */
export function ForeignSection({ stock }) {
  const { data, isLoading, error, refetch } = useStockForeign(stock.ticker)
  const series = data?.series ?? []
  const net30 = series.reduce((a, d) => a + d.net, 0)
  const net5 = series.slice(-5).reduce((a, d) => a + d.net, 0)
  const buyDays = series.filter((d) => d.net > 0).length

  return (
    <section id="khoi-ngoai" className="scroll-mt-24">
      <SectionHeader
        title="Khối ngoại"
        subtitle={data ? `${net30 >= 0 ? 'Mua ròng' : 'Bán ròng'} ${formatValueVnd(Math.abs(net30))} trong 30 phiên` : 'Dòng vốn nhà đầu tư nước ngoài'}
        tone={data ? (net30 >= 0 ? 'up' : 'down') : undefined}
      />
      {isLoading ? (
        <Skeleton className="h-72" />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Card className="flex flex-col p-5">
            <h3 className="ds-h3">Tỷ lệ sở hữu</h3>
            <p className="ds-caption">Giới hạn sở hữu nước ngoài (room) {data.room}%</p>
            <div className="mt-6">
              <div className="flex items-baseline justify-between">
                <span className="num text-3xl font-bold">{formatPercent(data.ownership, { sign: false, digits: 1 })}</span>
                <span className="text-xs text-muted">còn trống {formatPercent(data.room - data.ownership, { sign: false, digits: 1 })}</span>
              </div>
              <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-overlay">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-soft via-brand to-brand-deep" style={{ width: `${(data.ownership / data.room) * 100}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-faint">
                <span>0%</span>
                <span>{data.room}%</span>
              </div>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-4 border-t border-line pt-4">
              <Metric label="Ròng 5 phiên" value={<span className={net5 >= 0 ? 'text-up' : 'text-down'}>{formatValueVnd(net5)}</span>} />
              <Metric label="Số phiên mua ròng" value={`${buyDays}/${series.length}`} />
              <Metric label="Room còn lại" value={`${formatNumber(((data.room - data.ownership) / 100) * stock.shares, 1)} tr cp`} />
              <Metric label="Ròng 30 phiên" value={<span className={cn(net30 >= 0 ? 'text-up' : 'text-down')}>{formatValueVnd(net30)}</span>} />
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="ds-h3">Giá trị mua/bán ròng theo phiên</h3>
            <p className="ds-caption mb-3">Tỷ đồng · 30 phiên gần nhất</p>
            <BarChart
              height={240}
              showLegend={false}
              data={series.map((d) => {
                const dt = new Date(d.t)
                return { label: `${dt.getDate()}/${dt.getMonth() + 1}`, values: [d.net / 1e9] }
              })}
              keys={[{ label: 'Ròng', color: '#2fd28a' }]}
              colorFn={(v) => (v >= 0 ? '#2fd28a' : '#ff5a6a')}
              yFormat={(v) => formatNumber(v, 1)}
            />
          </Card>
        </div>
      )}
    </section>
  )
}
