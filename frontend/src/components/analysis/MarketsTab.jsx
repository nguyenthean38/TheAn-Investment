import { Fragment, useMemo } from 'react'
import { BarChart, Sparkline } from '@/components/charts'
import { BreadthBar } from '@/components/home/MarketCard'
import { Card, ChangePill, ChangeText, Chip, ErrorState, SectionHeader, Skeleton } from '@/components/ui'
import { useForeignMarket, useGlobalMarkets, useIndexHistory, useOverview } from '@/hooks/useMarket'
import { formatDate, formatNumber, formatPercent, formatPoint, formatValueVnd } from '@/utils/format'
import { cn } from '@/utils/cn'

const REGION_GROUPS = [
  { title: 'Châu Mỹ', regions: ['Mỹ'] },
  { title: 'Châu Á', regions: ['Nhật Bản', 'Hồng Kông', 'Trung Quốc', 'Hàn Quốc', 'Thái Lan'] },
  { title: 'Châu Âu', regions: ['Đức', 'Anh'] },
]

/** Thẻ chỉ số trong nước kèm sparkline 1 tháng. */
function IndexCard({ ix }) {
  const { data } = useIndexHistory(ix.code, '1M')
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm text-muted">{ix.name}</div>
          <div className="num mt-1 text-xl font-semibold">{formatPoint(ix.value)}</div>
          <ChangeText change={ix.change} pct={ix.changePct} digits={2} className="text-xs" />
        </div>
        {data ? <Sparkline values={data.map((d) => d.value)} width={92} height={40} /> : <Skeleton className="h-10 w-24" />}
      </div>
      <div className="mt-3 text-[11px] text-faint">Biến động 1 tháng</div>
    </Card>
  )
}

/** Bảng chỉ số thế giới theo khu vực. */
function GlobalTable({ indices }) {
  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="py-2.5 pr-3 pl-5 font-medium sm:pl-6">Chỉ số</th>
            <th className="px-3 py-2.5 text-right font-medium">Giá trị</th>
            <th className="px-3 py-2.5 text-right font-medium">Thay đổi</th>
            <th className="px-3 py-2.5 text-right font-medium">Từ đầu năm</th>
            <th className="px-3 py-2.5 font-medium">30 phiên</th>
            <th className="py-2.5 pr-5 pl-3 text-right font-medium sm:pr-6">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {REGION_GROUPS.map((g) => {
            const rows = indices.filter((i) => g.regions.includes(i.region))
            if (!rows.length) return null
            return (
              <Fragment key={g.title}>
                <tr>
                  <td colSpan={6} className="ds-label px-5 pt-5 pb-2 sm:px-6">
                    {g.title}
                  </td>
                </tr>
                {rows.map((i) => {
                  const volatile = Math.abs(i.changePct) > 1
                  return (
                    <tr key={i.code} className="border-b border-line last:border-0 hover:bg-raised/40">
                      <td className="py-3 pr-3 pl-5 sm:pl-6">
                        <div className="font-medium">{i.name}</div>
                        <div className="text-xs text-muted">{i.region}</div>
                      </td>
                      <td className="num px-3 py-3 text-right font-medium">{formatNumber(i.value, 2)}</td>
                      <td className="px-3 py-3 text-right">
                        <ChangeText change={i.change} pct={i.changePct} digits={2} className="text-[13px]" />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <ChangePill value={i.ytd} />
                      </td>
                      <td className="px-3 py-3">
                        <Sparkline values={i.spark} width={110} height={28} />
                      </td>
                      <td className="py-3 pr-5 pl-3 text-right sm:pr-6">
                        <Chip tone={volatile ? 'brand' : 'neutral'}>{volatile ? 'Biến động' : 'Ổn định'}</Chip>
                      </td>
                    </tr>
                  )
                })}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function MarketsTab() {
  const overview = useOverview()
  const global = useGlobalMarkets()
  const foreign = useForeignMarket()
  const chart = useMemo(
    () => (foreign.data?.series ?? []).map((d) => ({ label: formatDate(d.t, { day: '2-digit', month: '2-digit' }), values: [d.net / 1e9] })),
    [foreign.data],
  )
  const totalNet = useMemo(() => (foreign.data?.series ?? []).reduce((a, d) => a + d.net, 0), [foreign.data])

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader title="Chỉ số trong nước" subtitle={overview.data ? `Phiên ${overview.data.session.label.toLowerCase()}` : undefined} />
        {overview.error ? (
          <ErrorState error={overview.error} onRetry={overview.refetch} />
        ) : !overview.data ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-[18px]" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {overview.data.indices.map((ix) => (
                <IndexCard key={ix.code} ix={ix} />
              ))}
            </div>
            <Card className="mt-4 p-5">
              <div className="mb-3 text-sm font-medium">Độ rộng thị trường</div>
              <BreadthBar breadth={overview.data.breadth} liquidity={overview.data.liquidity} />
            </Card>
          </>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-6">
          <SectionHeader title="Chỉ số thế giới" subtitle="Diễn biến các thị trường lớn trong phiên gần nhất" />
          {global.error ? (
            <ErrorState error={global.error} onRetry={global.refetch} />
          ) : !global.data ? (
            <Skeleton className="h-96" />
          ) : (
            <GlobalTable indices={global.data.indices} />
          )}
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionHeader title="Hàng hoá & tỷ giá" subtitle="Yếu tố ảnh hưởng tới doanh nghiệp niêm yết" />
          {!global.data ? (
            <Skeleton className="h-72" />
          ) : (
            <ul className="divide-y divide-line">
              {global.data.commodities.map((c) => (
                <li key={c.code} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted">{c.region}</div>
                  </div>
                  <Sparkline values={c.spark} width={72} height={26} className="hidden sm:block" />
                  <span className="num w-24 text-right text-sm font-medium">{formatNumber(c.value, c.value > 1000 ? 0 : 2)}</span>
                  <ChangePill value={c.changePct} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <SectionHeader
          title="Giao dịch khối ngoại"
          subtitle="Giá trị mua/bán ròng 30 phiên gần nhất (tỷ đồng)"
          action={
            foreign.data && (
              <div className="text-right">
                <div className="ds-caption">Luỹ kế 30 phiên</div>
                <div className={cn('num text-lg font-semibold', totalNet >= 0 ? 'text-up' : 'text-down')}>
                  {totalNet >= 0 ? '+' : '-'}
                  {formatValueVnd(Math.abs(totalNet))}
                </div>
              </div>
            )
          }
        />
        {foreign.error ? (
          <ErrorState error={foreign.error} onRetry={foreign.refetch} />
        ) : !foreign.data ? (
          <Skeleton className="h-60" />
        ) : (
          <>
            <BarChart
              height={240}
              data={chart}
              keys={[{ label: 'Mua/bán ròng', color: '#2fd28a' }]}
              colorFn={(v) => (v >= 0 ? '#2fd28a' : '#ff5a6a')}
              yFormat={(v) => `${Math.round(v)} tỷ`}
              showLegend={false}
            />
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ['Mua ròng nhiều nhất', foreign.data.topBuy, 'text-up'],
                ['Bán ròng nhiều nhất', foreign.data.topSell, 'text-down'],
              ].map(([title, list, tone]) => (
                <div key={title} className="rounded-2xl border border-line bg-base p-4">
                  <div className="ds-caption mb-2">{title}</div>
                  <ul className="space-y-1.5">
                    {list.map((x) => (
                      <li key={x.ticker} className="flex items-center justify-between text-sm">
                        <span className="font-semibold">{x.ticker}</span>
                        <span className="flex items-center gap-3">
                          <span className="num text-xs text-muted">{formatPercent(x.changePct)}</span>
                          <span className={cn('num w-24 text-right font-medium', tone)}>{formatValueVnd(Math.abs(x.net))}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
