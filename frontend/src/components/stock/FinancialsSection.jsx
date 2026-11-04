import { Fragment, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, LineChart as LineIcon } from 'lucide-react'
import { BarChart, LineChart, SERIES_COLORS } from '@/components/charts'
import { Button, Card, ChangePill, Checkbox, ErrorState, Kbd, Modal, SectionHeader, Segmented, Skeleton, Tabs } from '@/components/ui'
import { useFinancials } from '@/hooks/useMarket'
import { cn } from '@/utils/cn'
import { formatNumber, formatPercent } from '@/utils/format'
import { pct } from './shared'

/** Định nghĩa các chỉ tiêu theo tab. unit: 'b' (tỷ đồng) | '%' | 'd' (đồng). */
const TABS = {
  key: {
    label: 'Chỉ số chính',
    groups: [
      [
        ['revenue', 'Doanh thu thuần', 'b'],
        ['grossProfit', 'Lợi nhuận gộp', 'b'],
        ['grossMargin', 'Biên lợi nhuận gộp', '%'],
        ['netIncome', 'Lợi nhuận sau thuế', 'b'],
        ['netMargin', 'Biên lợi nhuận ròng', '%'],
        ['eps', 'EPS', 'd'],
      ],
      [
        ['totalAssets', 'Tổng tài sản', 'b'],
        ['equity', 'Vốn chủ sở hữu', 'b'],
        ['debt', 'Nợ vay', 'b'],
        ['cash', 'Tiền & tương đương tiền', 'b'],
      ],
      [
        ['cfo', 'Dòng tiền kinh doanh', 'b'],
        ['fcf', 'Dòng tiền tự do', 'b'],
      ],
    ],
  },
  income: {
    label: 'Kết quả kinh doanh',
    groups: [
      [
        ['revenue', 'Doanh thu thuần', 'b'],
        ['cogs', 'Giá vốn hàng bán', 'b', -1],
        ['grossProfit', 'Lợi nhuận gộp', 'b'],
      ],
      [
        ['sga', 'Chi phí bán hàng & quản lý', 'b', -1],
        ['rnd', 'Chi phí nghiên cứu & phát triển', 'b', -1],
        ['operatingIncome', 'Lợi nhuận từ HĐKD', 'b'],
      ],
      [
        ['interestIncome', 'Doanh thu tài chính', 'b'],
        ['interestExpense', 'Chi phí lãi vay', 'b', -1],
        ['pretax', 'Lợi nhuận trước thuế', 'b'],
        ['tax', 'Thuế TNDN', 'b', -1],
        ['netIncome', 'Lợi nhuận sau thuế', 'b'],
        ['eps', 'EPS', 'd'],
      ],
    ],
  },
  balance: {
    label: 'Cân đối kế toán',
    groups: [
      [
        ['cash', 'Tiền & tương đương tiền', 'b'],
        ['receivables', 'Phải thu ngắn hạn', 'b'],
        ['inventory', 'Hàng tồn kho', 'b'],
        ['ppe', 'Tài sản cố định', 'b'],
        ['totalAssets', 'Tổng tài sản', 'b'],
      ],
      [
        ['liabilities', 'Nợ phải trả', 'b'],
        ['debt', 'Vay & nợ thuê tài chính', 'b'],
        ['equity', 'Vốn chủ sở hữu', 'b'],
      ],
    ],
  },
  cashflow: {
    label: 'Lưu chuyển tiền tệ',
    groups: [
      [
        ['cfo', 'Lưu chuyển từ HĐKD', 'b'],
        ['capex', 'Chi mua sắm TSCĐ', 'b'],
        ['fcf', 'Dòng tiền tự do', 'b'],
      ],
      [
        ['cfi', 'Lưu chuyển từ đầu tư', 'b'],
        ['cff', 'Lưu chuyển từ tài chính', 'b'],
        ['dividendsPaid', 'Cổ tức đã trả', 'b'],
      ],
    ],
  },
}

const ALL_ROWS = Object.fromEntries(Object.values(TABS).flatMap((t) => t.groups.flat().map((r) => [r[0], r])))
const VISIBLE = 6

function fmt(v, unit, sign = 1) {
  if (v == null || Number.isNaN(v)) return null
  if (unit === '%') return formatPercent(v, { sign: false, digits: 1 })
  const x = v * sign
  if (unit === 'd') return formatNumber(x)
  return formatNumber(x, Math.abs(x) < 10 ? 2 : 0)
}

/** Mục "Báo cáo tài chính" [F]. */
export function FinancialsSection({ stock }) {
  const { data, isLoading, error, refetch } = useFinancials(stock.ticker)
  const [tab, setTab] = useState('key')
  const [period, setPeriod] = useState('quarterly')
  const [offset, setOffset] = useState(0) // số kỳ lùi lại so với kỳ mới nhất
  const [hoverRow, setHoverRow] = useState(null)
  const [selected, setSelected] = useState([])
  const [compareOpen, setCompareOpen] = useState(false)

  const rows = data?.[period] ?? []
  const lag = period === 'quarterly' ? 4 : 1
  const maxOffset = Math.max(0, rows.length - VISIBLE)
  const end = rows.length - Math.min(offset, maxOffset)
  const visible = rows.slice(Math.max(0, end - VISIBLE), end)
  const startIdx = Math.max(0, end - VISIBLE)

  // Phím Enter / Esc cho thanh chọn chỉ tiêu
  useEffect(() => {
    if (!selected.length || compareOpen) return
    const onKey = (e) => {
      if (document.querySelector('[aria-modal="true"]')) return
      if (e.key === 'Enter') {
        e.preventDefault()
        setCompareOpen(true)
      } else if (e.key === 'Escape') setSelected([])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected.length, compareOpen])

  const toggle = (key) => setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : s.length >= 5 ? s : [...s, key]))

  return (
    <section id="tai-chinh" className="scroll-mt-24">
      <SectionHeader
        title="Báo cáo tài chính"
        kbd="F"
        subtitle="Đơn vị: tỷ đồng (EPS: đồng/cổ phiếu)"
        action={
          <Segmented
            size="sm"
            value={period}
            onChange={(v) => {
              setPeriod(v)
              setOffset(0)
            }}
            options={[
              { value: 'quarterly', label: 'Theo quý' },
              { value: 'annual', label: 'Theo năm' },
            ]}
          />
        }
      />
      {isLoading ? (
        <Skeleton className="h-[520px]" />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      ) : (
        <>
          <TrendCharts rows={rows} />
          <Card className="mt-4 overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-4">
              <Tabs className="flex-1 overflow-x-auto scrollbar-none" options={Object.entries(TABS).map(([value, t]) => ({ value, label: t.label }))} value={tab} onChange={setTab} />
              <div className="mb-2 flex items-center gap-1">
                <Button size="sm" icon variant="ghost" aria-label="Kỳ cũ hơn" disabled={offset >= maxOffset} onClick={() => setOffset((o) => Math.min(maxOffset, o + 1))}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button size="sm" icon variant="ghost" aria-label="Kỳ mới hơn" disabled={offset <= 0} onClick={() => setOffset((o) => Math.max(0, o - 1))}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-[13px]">
                <thead>
                  <tr className="text-xs text-muted">
                    <th className="sticky left-0 z-10 w-[260px] bg-surface px-5 py-3 text-left font-medium">Chỉ tiêu</th>
                    {visible.map((r, i) => {
                      const latest = startIdx + i === rows.length - 1
                      return (
                        <th key={r.period} className={cn('px-4 py-3 text-right font-medium whitespace-nowrap', latest && 'bg-brand/[0.05]')}>
                          <span className={cn(latest && 'text-brand')}>{r.period}</span>
                          {latest && <span className="ml-1.5 rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] text-brand">Gần nhất</span>}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {TABS[tab].groups.map((group, gi) => (
                    <Fragment key={gi}>
                      {gi > 0 && (
                        <tr aria-hidden>
                          <td colSpan={visible.length + 1} className="h-2 border-t border-line-strong" />
                        </tr>
                      )}
                      {group.map(([key, label, unit, sign = 1]) => {
                        const isHover = hoverRow === key
                        const checked = selected.includes(key)
                        return (
                          <tr
                            key={key}
                            onMouseEnter={() => setHoverRow(key)}
                            onMouseLeave={() => setHoverRow(null)}
                            onClick={() => toggle(key)}
                            className={cn('cursor-pointer border-t border-line transition-colors', isHover || checked ? 'bg-raised/70' : '')}
                          >
                            <td className={cn('sticky left-0 z-10 px-5 py-3', isHover || checked ? 'bg-raised' : 'bg-surface')}>
                              <span className="flex items-center gap-3">
                                <Checkbox checked={checked} onChange={() => toggle(key)} label={`Chọn ${label}`} className={cn(!checked && !isHover && 'opacity-40')} />
                                <span className={cn(['grossProfit', 'netIncome', 'totalAssets', 'fcf', 'operatingIncome', 'pretax'].includes(key) ? 'font-semibold text-fg' : 'text-dim')}>{label}</span>
                              </span>
                            </td>
                            {visible.map((r, i) => {
                              const v = r[key]
                              const idx = startIdx + i
                              const prev = rows[idx - lag]?.[key]
                              const yoy = unit === '%' ? (prev != null ? v - prev : null) : pct(v, prev)
                              const latest = idx === rows.length - 1
                              const notReported = key === 'rnd' && !v
                              return (
                                <td key={r.period} className={cn('num px-4 py-3 text-right align-top whitespace-nowrap', latest && 'bg-brand/[0.04] text-brand-soft')}>
                                  {notReported ? <span className="text-faint">Không báo cáo</span> : <span className={cn(v * sign < 0 && 'text-down')}>{fmt(v, unit, sign) ?? '—'}</span>}
                                  {isHover && yoy != null && !notReported && (
                                    <div className="mt-1">
                                      <ChangePill size="sm" value={yoy} digits={1} />
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-[11.5px] text-faint">Di chuột vào một dòng để xem tăng trưởng so với cùng kỳ · Chọn tối đa 5 chỉ tiêu để so sánh trên biểu đồ.</p>
          </Card>
        </>
      )}

      {selected.length > 0 && !compareOpen && (
        <div className="fixed inset-x-0 bottom-24 z-30 flex justify-center px-3 sm:bottom-28">
          <div className="flex animate-slide-up items-center gap-2 rounded-full border border-line-strong bg-raised/95 py-1.5 pr-1.5 pl-4 shadow-2xl backdrop-blur">
            <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand">{selected.length} chỉ tiêu</span>
            <Button size="sm" variant="primary" onClick={() => setCompareOpen(true)}>
              <LineIcon className="size-3.5" /> So sánh <Kbd className="ml-1 border-black/20 bg-black/10 text-canvas">Enter</Kbd>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
              Huỷ <Kbd className="ml-1">Esc</Kbd>
            </Button>
          </div>
        </div>
      )}

      <CompareModal open={compareOpen} onClose={() => setCompareOpen(false)} rows={rows} keys={selected} period={period} />
    </section>
  )
}

/** Biểu đồ Doanh thu & Lợi nhuận + xu hướng biên lợi nhuận. */
function TrendCharts({ rows }) {
  const recent = rows.slice(-8)
  const marginSeries = useMemo(
    () => [
      { id: 'gm', label: 'Biên LN gộp', color: '#a78bfa', data: recent.map((r, i) => ({ t: i, value: +r.grossMargin.toFixed(2) })) },
      { id: 'nm', label: 'Biên LN ròng', color: '#ffa36c', data: recent.map((r, i) => ({ t: i, value: +r.netMargin.toFixed(2) })) },
    ],
    [recent],
  )
  const marginTrend = recent.length > 1 ? recent[recent.length - 1].netMargin - recent[0].netMargin : 0
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="ds-h3">Doanh thu & lợi nhuận</h3>
        <p className="ds-caption mb-3">Tỷ đồng · {recent.length} kỳ gần nhất</p>
        <BarChart
          height={210}
          data={recent.map((r) => ({ label: r.period, values: [r.revenue, r.netIncome] }))}
          keys={[
            { label: 'Doanh thu thuần', color: '#5b5b66' },
            { label: 'Lợi nhuận sau thuế', color: '#ffa36c' },
          ]}
          yFormat={(v) => formatNumber(v)}
        />
      </Card>
      <Card className="p-5">
        <h3 className="ds-h3">Xu hướng biên lợi nhuận</h3>
        <p className={cn('mb-3 text-[12px]', marginTrend >= 0 ? 'text-up' : 'text-down')}>{marginTrend >= 0 ? 'Biên lợi nhuận đang mở rộng' : 'Biên lợi nhuận đang thu hẹp'}</p>
        <LineChart height={236} series={marginSeries} yFormat={(v) => `${v.toFixed(1)}%`} xFormat={(i) => recent[i]?.period ?? ''} />
      </Card>
    </div>
  )
}

function CompareModal({ open, onClose, rows, keys, period }) {
  const defs = keys.map((k) => ALL_ROWS[k]).filter(Boolean)
  const units = new Set(defs.map((d) => d[2]))
  const normalize = units.size > 1
  const series = defs.map(([key, label, , sign = 1], i) => ({
    id: key,
    label,
    color: SERIES_COLORS[i % SERIES_COLORS.length],
    data: rows.map((r, j) => ({ t: j, value: r[key] == null ? null : r[key] * sign })),
  }))
  const unit = [...units][0]
  return (
    <Modal open={open} onClose={onClose} size="lg" title="So sánh chỉ tiêu" description={`${period === 'quarterly' ? 'Theo quý' : 'Theo năm'} · ${normalize ? 'quy đổi về % thay đổi do khác đơn vị' : unit === '%' ? 'đơn vị %' : unit === 'd' ? 'đơn vị đồng' : 'đơn vị tỷ đồng'}`}>
      {open && defs.length > 0 && (
        <>
          <LineChart
            height={320}
            series={series}
            normalize={normalize}
            yFormat={(v) => (unit === '%' ? `${v.toFixed(1)}%` : formatNumber(v))}
            xFormat={(i) => rows[i]?.period ?? ''}
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="py-2 text-left font-medium">Chỉ tiêu</th>
                  <th className="py-2 text-right font-medium">Thấp nhất</th>
                  <th className="py-2 text-right font-medium">Trung bình</th>
                  <th className="py-2 text-right font-medium">Cao nhất</th>
                  <th className="py-2 text-right font-medium">Thay đổi</th>
                </tr>
              </thead>
              <tbody>
                {series.map((s, i) => {
                  const vals = s.data.map((d) => d.value).filter((v) => v != null)
                  const u = defs[i][2]
                  const f = (v) => (u === '%' ? formatPercent(v, { sign: false, digits: 1 }) : formatNumber(v, Math.abs(v) < 10 ? 2 : 0))
                  return (
                    <tr key={s.id} className="border-t border-line">
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-3 w-[3px] rounded-full" style={{ background: s.color }} />
                          {s.label}
                        </span>
                      </td>
                      <td className="num py-2.5 text-right">{f(Math.min(...vals))}</td>
                      <td className="num py-2.5 text-right">{f(vals.reduce((a, b) => a + b, 0) / vals.length)}</td>
                      <td className="num py-2.5 text-right">{f(Math.max(...vals))}</td>
                      <td className="py-2.5 text-right">
                        <ChangePill size="sm" value={u === '%' ? vals[vals.length - 1] - vals[0] : pct(vals[vals.length - 1], vals[0])} digits={1} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  )
}
