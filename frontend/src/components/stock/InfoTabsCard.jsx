import { useMemo, useState } from 'react'
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react'
import { Chip, ErrorState, Segmented, Skeleton } from '@/components/ui'
import { useFinancials, useNews, useStocks } from '@/hooks/useMarket'
import { cn } from '@/utils/cn'
import { formatNumber, formatPercent, formatRatio, timeAgo } from '@/utils/format'

const SENTIMENT = {
  positive: { label: 'Tích cực', tone: 'up' },
  negative: { label: 'Tiêu cực', tone: 'down' },
  neutral: { label: 'Trung tính', tone: 'neutral' },
}

/** Thẻ xếp chồng bên phải: Tin tức / Chỉ số / Hồ sơ. */
export function InfoTabsCard({ stock }) {
  const [tab, setTab] = useState('news')
  return (
    <div id="tin-tuc" className="relative scroll-mt-24">
      {/* hiệu ứng "xếp chồng" */}
      <div className="absolute inset-x-5 -bottom-2 h-6 rounded-b-3xl border border-line bg-surface/60" aria-hidden />
      <div className="absolute inset-x-2.5 -bottom-1 h-6 rounded-b-3xl border border-line bg-surface/80" aria-hidden />
      <div className="relative flex h-full min-h-[460px] flex-col overflow-hidden rounded-3xl border border-line-strong bg-canvas shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <Segmented
            size="sm"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'news', label: 'Tin tức' },
              { value: 'kpi', label: 'Chỉ số' },
              { value: 'about', label: 'Hồ sơ' },
            ]}
          />
        </div>
        <div className="max-h-[520px] flex-1 overflow-y-auto">
          {tab === 'news' && <NewsTab ticker={stock.ticker} />}
          {tab === 'kpi' && <KpiTab stock={stock} />}
          {tab === 'about' && <AboutTab stock={stock} />}
        </div>
      </div>
    </div>
  )
}

function NewsTab({ ticker }) {
  const { data, isLoading, error, refetch } = useNews({ ticker, limit: 8 })
  if (isLoading)
    return (
      <div className="space-y-4 p-5">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  if (error) return <ErrorState error={error} onRetry={refetch} />
  const [lead, ...rest] = data
  return (
    <div>
      {lead && (
        <article className="border-b border-line px-5 pt-5 pb-5">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted">
            <Chip tone={SENTIMENT[lead.sentiment].tone}>{SENTIMENT[lead.sentiment].label}</Chip>
            {timeAgo(lead.publishedAt)} · {lead.source}
          </div>
          <h3 className="text-[15.5px] leading-[1.5] font-semibold text-fg">{lead.title}</h3>
          <blockquote className="mt-3 border-l-2 border-brand/70 pl-3.5 text-[13.5px] leading-relaxed text-dim">{lead.summary}</blockquote>
          <p className="mt-2 text-[11.5px] text-faint">Tổng hợp từ {lead.sourceCount} nguồn</p>
        </article>
      )}
      <ul>
        {rest.map((n) => (
          <li key={n.id} className="border-b border-line px-5 py-3.5 last:border-0">
            <div className="flex items-start gap-3">
              <span className={cn('mt-2 size-1.5 shrink-0 rounded-full', n.sentiment === 'positive' ? 'bg-up' : n.sentiment === 'negative' ? 'bg-down' : 'bg-faint')} />
              <div className="min-w-0">
                <p className="text-[13.5px] leading-[1.55] text-fg">{n.title}</p>
                <p className="mt-1 text-[11.5px] text-muted">
                  {timeAgo(n.publishedAt)} · {n.source}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function KpiTab({ stock }) {
  const { data: all } = useStocks()
  const { data: fin } = useFinancials(stock.ticker)
  const rows = useMemo(() => {
    const peers = (all ?? []).filter((s) => s.sector === stock.sector)
    const avg = (k) => (peers.length ? peers.reduce((a, s) => a + s[k], 0) / peers.length : null)
    const pe = avg('pe')
    const margin = avg('netMargin')
    const last = fin?.quarterly?.[fin.quarterly.length - 1]
    const de = last ? last.debt / last.equity : null
    const roomLeft = stock.foreignRoom - stock.foreignOwnership
    return [
      { label: 'Tỷ suất sinh lời trên vốn (ROE)', value: formatPercent(stock.roe, { sign: false, digits: 1 }), good: stock.roe >= 15, note: stock.roe >= 15 ? 'Hiệu quả sử dụng vốn tốt' : 'Dưới ngưỡng 15%' },
      { label: 'Biên lợi nhuận ròng', value: formatPercent(stock.netMargin, { sign: false, digits: 1 }), good: margin == null || stock.netMargin >= margin, note: margin != null ? `Trung bình ngành ${formatPercent(margin, { sign: false, digits: 1 })}` : null },
      { label: 'Tăng trưởng doanh thu', value: formatPercent(stock.revenueGrowth, { digits: 1 }), good: stock.revenueGrowth > 0, note: 'So với cùng kỳ' },
      { label: 'Tăng trưởng EPS', value: formatPercent(stock.epsGrowth, { digits: 1 }), good: stock.epsGrowth > 0, note: 'So với cùng kỳ' },
      { label: 'P/E so với ngành', value: formatRatio(stock.pe), good: pe == null || stock.pe <= pe, note: pe != null ? `Ngành ${formatRatio(pe)} — ${stock.pe <= pe ? 'rẻ hơn' : 'đắt hơn'} ${formatPercent(Math.abs((stock.pe / pe - 1) * 100), { sign: false, digits: 0 })}` : null },
      { label: 'Nợ vay / Vốn chủ sở hữu', value: de != null ? formatRatio(de, 2) : '—', good: de == null || de < 1, note: de != null && de < 1 ? 'Đòn bẩy an toàn' : 'Đòn bẩy cao' },
      { label: 'Tỷ suất cổ tức', value: formatPercent(stock.dividendYield, { sign: false }), good: stock.dividendYield >= 2, note: stock.dividendYield >= 2 ? 'Cổ tức hấp dẫn' : 'Cổ tức thấp' },
      { label: 'Room ngoại còn lại', value: formatPercent(roomLeft, { sign: false, digits: 1 }), good: roomLeft > 5, note: `Giới hạn ${stock.foreignRoom}%` },
    ]
  }, [all, fin, stock])
  return (
    <div className="p-5">
      <h3 className="ds-label mb-2">Chỉ báo sức khoẻ</h3>
      <ul>
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
            {r.good ? <CheckCircle2 className="size-[18px] shrink-0 text-up" /> : <XCircle className="size-[18px] shrink-0 text-down" />}
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] text-fg">{r.label}</div>
              {r.note && <div className="truncate text-[11.5px] text-muted">{r.note}</div>}
            </div>
            <span className="num text-[13.5px] font-semibold text-fg">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AboutTab({ stock }) {
  const p = stock.profile ?? {}
  const facts = [
    ['Thành lập', p.founded],
    ['Trụ sở', p.hq],
    ['Nhân sự', p.employees ? `${formatNumber(p.employees)} người` : '—'],
    ['Tổng giám đốc', p.ceo],
    ['Ngành', stock.sectorName],
    ['Sàn niêm yết', stock.exchange],
    ['Cổ phiếu lưu hành', `${formatNumber(stock.shares)} triệu`],
  ]
  return (
    <div className="p-5">
      <h3 className="ds-h3">Về {stock.ticker}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-dim">{p.about}</p>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
        {facts.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="ds-caption">{k}</dt>
            <dd className="mt-0.5 truncate text-[13.5px] font-medium text-fg">{v ?? '—'}</dd>
          </div>
        ))}
      </dl>
      <a
        href={`https://www.google.com/search?q=${encodeURIComponent(stock.name)}`}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-[13px] text-dim transition-colors hover:bg-raised hover:text-fg"
      >
        Tìm hiểu thêm về doanh nghiệp <ExternalLink className="size-3.5" />
      </a>
    </div>
  )
}
