import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { LineChart, SERIES_COLORS } from '@/components/charts'
import { Card, Kbd, Segmented, Skeleton } from '@/components/ui'
import { SeriesPanel, INDEX_ID, MAX_SERIES } from '@/components/compare/SeriesPanel'
import { SeriesTable } from '@/components/compare/SeriesTable'
import { marketApi, stockApi } from '@/api'
import { qk } from '@/hooks/queryClient'
import { useStocks } from '@/hooks/useMarket'
import { useHotkeys } from '@/hooks/useHotkeys'
import { formatBillion, formatDate, formatPercent, formatPoint, formatPrice } from '@/utils/format'

const DEFAULT = ['FPT', 'VCB', 'HPG']
const RANGES = [
  { value: '1W', label: '1T' },
  { value: '1M', label: '1TH' },
  { value: '3M', label: '3TH' },
  { value: '6M', label: '6TH' },
  { value: 'YTD', label: 'YTD' },
  { value: '1Y', label: '1NĂM' },
  { value: '3Y', label: '3NĂM' },
]
const METRICS = [
  { value: 'price', label: 'Giá (% thay đổi)' },
  { value: 'revenue', label: 'Doanh thu' },
  { value: 'netIncome', label: 'Lợi nhuận' },
  { value: 'netMargin', label: 'Biên LN ròng' },
]
const nf1 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })
/** Nhãn trục gọn: 12,3 N tỷ / 850 tỷ */
const shortBillion = (v) => (Math.abs(v) >= 1000 ? `${nf1.format(v / 1000)} N tỷ` : `${nf1.format(v)} tỷ`)
const RANGE_TEXT = { '1W': '1 tuần', '1M': '1 tháng', '3M': '3 tháng', '6M': '6 tháng', YTD: 'từ đầu năm', '1Y': '1 năm', '3Y': '3 năm' }

/** Ngày giữa quý → mốc thời gian dùng chung cho các mã. */
const quarterT = (row) => new Date(row.year, row.quarter * 3 - 2, 15).getTime()

export default function ComparePage() {
  const [params, setParams] = useSearchParams()
  const [range, setRange] = useState('1Y')
  const [metric, setMetric] = useState('price')
  const [adding, setAdding] = useState(false)
  const { data: stocks = [] } = useStocks()
  const byTicker = useMemo(() => new Map(stocks.map((s) => [s.ticker, s])), [stocks])

  const tickers = useMemo(() => {
    const raw = params.get('tickers')
    const list = raw ? raw.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean) : DEFAULT
    return [...new Set(list)].slice(0, MAX_SERIES)
  }, [params])
  const isPrice = metric === 'price'
  const active = isPrice ? tickers : tickers.filter((t) => t !== INDEX_ID)

  const setTickers = (list) => {
    const p = new URLSearchParams(params)
    p.set('tickers', list.join(','))
    setParams(p, { replace: true })
  }
  const add = (t) => !tickers.includes(t) && tickers.length < MAX_SERIES && setTickers([...tickers, t])
  const remove = (t) => tickers.length > 1 && setTickers(tickers.filter((x) => x !== t))

  const cycle = (dir) => {
    if (!isPrice) return
    const i = RANGES.findIndex((r) => r.value === range)
    setRange(RANGES[(i + dir + RANGES.length) % RANGES.length].value)
  }
  useHotkeys({ c: () => setAdding(true), '[': () => cycle(-1), ']': () => cycle(1) })

  const results = useQueries({
    queries: active.map((t) =>
      isPrice
        ? t === INDEX_ID
          ? { queryKey: qk.indexHistory(INDEX_ID, range), queryFn: () => marketApi.indexHistory(INDEX_ID, range) }
          : { queryKey: qk.history(t, range), queryFn: () => stockApi.history(t, range) }
        : { queryKey: qk.financials(t), queryFn: () => stockApi.financials(t) },
    ),
  })
  const loading = results.some((r) => r.isLoading)
  const periodByT = new Map()

  const series = active
    .map((t, i) => {
      const r = results[i]
      if (!r?.data) return null
      const color = SERIES_COLORS[tickers.indexOf(t) % SERIES_COLORS.length]
      const snap = byTicker.get(t)
      const base = { id: t, label: t === INDEX_ID ? 'VN-Index' : t, name: t === INDEX_ID ? 'Chỉ số VN-Index' : (snap?.name ?? ''), color }
      if (isPrice) return { ...base, data: r.data.map((d) => ({ t: d.t, value: d.value })), format: t === INDEX_ID ? formatPoint : formatPrice }
      const rows = r.data.quarterly
      rows.forEach((row) => periodByT.set(quarterT(row), row.period))
      return {
        ...base,
        data: rows.map((row) => ({ t: quarterT(row), value: row[metric] })),
        format: metric === 'netMargin' ? (v) => formatPercent(v, { sign: false, digits: 1 }) : (v) => formatBillion(v),
      }
    })
    .filter(Boolean)

  const metricLabel = METRICS.find((m) => m.value === metric).label
  const xFormat = isPrice ? (t) => formatDate(t, { day: '2-digit', month: '2-digit', year: '2-digit' }) : (t) => periodByT.get(t) ?? formatDate(t)

  return (
    <>
      <AppHeader title="So sánh biểu đồ" subtitle="Đặt nhiều cổ phiếu lên cùng một biểu đồ để thấy ai đang dẫn nhịp" />
      <main className="container-app">
        <Card className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <SeriesPanel
            series={tickers.map((t) => ({
              id: t,
              label: t === INDEX_ID ? 'VN-Index' : t,
              name: t === INDEX_ID ? 'Chỉ số VN-Index' : (byTicker.get(t)?.name ?? ''),
              color: SERIES_COLORS[tickers.indexOf(t) % SERIES_COLORS.length],
            }))}
            onAdd={add}
            onRemove={remove}
            adding={adding}
            setAdding={setAdding}
            allowIndex
          />

          <section className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Segmented size="sm" options={METRICS} value={metric} onChange={setMetric} ariaLabel="Chỉ tiêu so sánh" />
              {isPrice ? (
                <Segmented size="sm" options={RANGES} value={range} onChange={setRange} ariaLabel="Khung thời gian" />
              ) : (
                <span className="text-xs text-muted">12 quý gần nhất · đơn vị {metric === 'netMargin' ? '%' : 'tỷ đồng'}</span>
              )}
            </div>
            {!isPrice && tickers.includes(INDEX_ID) && (
              <p className="mb-3 flex items-center gap-1.5 text-xs text-muted">
                <Info className="size-3.5" /> VN-Index không có số liệu tài chính nên tạm ẩn ở chỉ tiêu này.
              </p>
            )}
            {loading && !series.length ? (
              <Skeleton className="h-[380px]" />
            ) : (
              <LineChart
                series={series}
                height={380}
                normalize={isPrice}
                yFormat={metric === 'netMargin' ? (v) => `${nf1.format(v)}%` : shortBillion}
                xFormat={xFormat}
                tooltipTitle={isPrice ? (t) => formatDate(t) : xFormat}
              />
            )}
            {isPrice && (
              <p className="mt-3 text-[11.5px] text-faint">
                Nhấn <Kbd>[</Kbd> <Kbd>]</Kbd> để chuyển khung thời gian · <Kbd>C</Kbd> để thêm mã
              </p>
            )}
          </section>
        </Card>

        <Card className="mt-6 p-4 sm:p-6">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="ds-h2">Chuỗi dữ liệu</h2>
            <span className="text-xs text-muted">{isPrice ? `${metricLabel} · ${RANGE_TEXT[range]}` : `${metricLabel} · 12 quý`}</span>
          </div>
          {loading && !series.length ? (
            <Skeleton className="h-40" />
          ) : (
            <SeriesTable series={series} onRemove={remove} changeLabel={isPrice ? `Thay đổi ${RANGE_TEXT[range]}` : 'Thay đổi 12 quý'} />
          )}
        </Card>
      </main>
    </>
  )
}
