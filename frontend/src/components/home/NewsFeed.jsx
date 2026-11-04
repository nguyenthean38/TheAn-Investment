import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Newspaper, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Button, ChangePill, ErrorState, Modal, Skeleton, TickerLogo } from '@/components/ui'
import { useNews, useStocks } from '@/hooks/useMarket'
import { vnNow } from '@/lib/time'
import { formatDate, formatTime, timeAgo } from '@/utils/format'
import { cn } from '@/utils/cn'

const SENTIMENT = {
  positive: { label: 'Tích cực', dot: 'bg-up', text: 'text-up' },
  negative: { label: 'Tiêu cực', dot: 'bg-down', text: 'text-down' },
  neutral: { label: 'Trung tính', dot: 'bg-ref', text: 'text-ref' },
}

/** Chip mã cổ phiếu có % thay đổi. */
function TickerChip({ ticker, stock, onClick }) {
  return (
    <Link
      to={`/app/co-phieu/${ticker}`}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-raised py-0.5 pr-1 pl-0.5 text-xs font-semibold transition-colors hover:border-muted"
    >
      <TickerLogo ticker={ticker} color={stock?.color} size={20} />
      {ticker}
      {stock && <ChangePill value={stock.changePct} size="sm" />}
    </Link>
  )
}

/** Thang độ tin cậy dựa trên số nguồn đưa tin. */
function Reliability({ count }) {
  const level = count >= 4 ? 'high' : count >= 3 ? 'mid' : 'low'
  const cfg = {
    high: { label: 'Độ tin cậy cao', color: 'bg-up', text: 'text-up', Icon: ShieldCheck },
    mid: { label: 'Tương đối tin cậy', color: 'bg-ref', text: 'text-ref', Icon: ShieldCheck },
    low: { label: 'Cân nhắc thận trọng', color: 'bg-down', text: 'text-down', Icon: ShieldAlert },
  }[level]
  return (
    <div className="rounded-2xl border border-line bg-base p-4">
      <div className="flex items-center justify-between gap-3">
        <span className={cn('inline-flex items-center gap-2 text-sm font-medium', cfg.text)}>
          <cfg.Icon className="size-4" /> {cfg.label}
        </span>
        <span className="num text-xs text-muted">{count}/5 nguồn xác nhận</span>
      </div>
      <div className="mt-3 flex gap-1" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < count ? cfg.color : 'bg-overlay')} />
        ))}
      </div>
      <p className="mt-2.5 text-xs text-muted">
        {level === 'low'
          ? 'Tin này mới được ít nguồn đưa tin. Hãy kiểm chứng thêm trước khi ra quyết định.'
          : 'Thông tin đã được nhiều nguồn độc lập đưa tin.'}
      </p>
    </div>
  )
}

function NewsModal({ item, all, byTicker, onClose, onOpen }) {
  const related = useMemo(() => {
    if (!item) return []
    const same = all.filter((n) => n.id !== item.id && n.tickers.some((t) => item.tickers.includes(t)))
    const rest = all.filter((n) => n.id !== item.id && !same.includes(n) && n.sentiment === item.sentiment)
    return [...same, ...rest].slice(0, 4)
  }, [item, all])
  const s = item ? SENTIMENT[item.sentiment] : null
  return (
    <Modal open={!!item} onClose={onClose} size="lg" title="Tóm tắt tin tức">
      {item && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {item.tickers.map((t) => (
              <TickerChip key={t} ticker={t} stock={byTicker.get(t)} onClick={onClose} />
            ))}
            <span>
              {formatDate(item.publishedAt)} · {formatTime(item.publishedAt)}
            </span>
            <span>· {item.source}</span>
          </div>
          <h3 className="text-xl leading-[1.45] font-semibold">{item.title}</h3>
          <p className="text-[15px] leading-[1.7] text-dim">{item.summary}</p>
          <div className="flex items-center gap-2 text-sm">
            <span className={cn('size-2 rounded-full', s.dot)} />
            Sắc thái: <span className={s.text}>{s.label}</span>
          </div>
          <Reliability count={item.sourceCount} />
          {related.length > 0 && (
            <div>
              <h4 className="ds-label mb-2">Tin liên quan</h4>
              <ul className="divide-y divide-line">
                {related.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => onOpen(n)} className="w-full py-3 text-left transition-opacity hover:opacity-80">
                      <span className="block text-sm font-medium text-fg">{n.title}</span>
                      <span className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <span className={cn('size-1.5 rounded-full', SENTIMENT[n.sentiment].dot)} />
                        {timeAgo(n.publishedAt, vnNow().getTime())} · {n.source}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

/** Bảng tin: thẻ tin với chip mã, sắc thái, thời gian; bấm để xem tóm tắt. */
export function NewsFeed() {
  const { data, isLoading, error, refetch } = useNews({ limit: 20 })
  const { data: stocks = [] } = useStocks()
  const byTicker = useMemo(() => new Map(stocks.map((s) => [s.ticker, s])), [stocks])
  const [limit, setLimit] = useState(8)
  const [active, setActive] = useState(null)
  const now = vnNow().getTime()

  return (
    <section aria-labelledby="news-title">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="news-title" className="ds-h3 flex items-center gap-2">
          <Newspaper className="size-4 text-muted" /> Tin tức thị trường
        </h2>
        {data && <span className="text-xs text-muted">{data.length} tin mới</span>}
      </div>
      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-[18px]" />
          ))}
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {data.slice(0, limit).map((n) => {
              const s = SENTIMENT[n.sentiment]
              return (
                <li key={n.id}>
                  <article
                    role="button"
                    tabIndex={0}
                    onClick={() => setActive(n)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setActive(n))}
                    className="card cursor-pointer p-5 transition-colors hover:border-line-strong hover:bg-raised/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        {n.tickers.length ? (
                          n.tickers.map((t) => <TickerChip key={t} ticker={t} stock={byTicker.get(t)} onClick={(e) => e.stopPropagation()} />)
                        ) : (
                          <span className="rounded-full border border-line-strong bg-raised px-2.5 py-0.5 text-xs font-medium text-dim">Vĩ mô</span>
                        )}
                      </div>
                      <span className="num shrink-0 text-xs text-muted">{timeAgo(n.publishedAt, now)}</span>
                    </div>
                    <h3 className="mt-3 text-[15px] leading-[1.55] font-medium text-fg">{n.title}</h3>
                    <div className="mt-2.5 flex items-center gap-2 text-xs text-muted">
                      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
                      <span className={s.text}>{s.label}</span>
                      <span>· {n.source}</span>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
          {limit < data.length && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={() => setLimit((l) => l + 8)}>
                Xem thêm tin
              </Button>
            </div>
          )}
        </>
      )}
      <NewsModal item={active} all={data ?? []} byTicker={byTicker} onClose={() => setActive(null)} onOpen={setActive} />
    </section>
  )
}
