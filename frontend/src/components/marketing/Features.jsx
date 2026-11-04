import { useEffect, useMemo, useState } from 'react'
import { BarChart3, CalendarDays, Command, FileText, ListFilter, Search, Sparkles, Star, Target, X } from 'lucide-react'
import { Sparkline, useElementSize } from '@/components/charts'
import { ChangePill, Kbd, Skeleton, TickerLogo } from '@/components/ui'
import { useAnalysts, useEvents, useRecap, useStock, useStockHistory, useStocks } from '@/hooks/useMarket'
import { formatBillion, formatPercent, formatPrice, formatRatio, weekdayShort } from '@/utils/format'
import { cn } from '@/utils/cn'

function FeatureCard({ icon: Icon, eyebrow, title, description, children, className }) {
  return (
    <article className={cn('group relative flex flex-col overflow-hidden rounded-[22px] border border-line bg-surface p-6 transition-colors hover:border-line-strong sm:p-7', className)}>
      <div className="pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-brand/0 blur-3xl transition-colors duration-500 group-hover:bg-brand/10" aria-hidden />
      <div className="relative flex items-center gap-2 text-[12.5px] font-medium text-brand">
        <Icon className="size-4" aria-hidden />
        {eyebrow}
      </div>
      <h3 className="relative mt-3 text-[19px] leading-snug font-semibold tracking-tight">{title}</h3>
      <p className="relative mt-2 text-sm text-muted">{description}</p>
      <div className="relative mt-6 flex-1">{children}</div>
    </article>
  )
}

/* ---------- Bản tin sáng ---------- */
function RecapWidget() {
  const { data } = useRecap()
  if (!data) return <Skeleton className="h-40" />
  return (
    <div className="space-y-2.5">
      {data.highlights.map((h) => (
        <div key={h.label} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-base px-3.5 py-2.5 text-[13px]">
          <span className="text-muted">{h.label}</span>
          <span className="flex items-center gap-2 font-medium">
            {h.value}
            {h.changePct != null && <ChangePill value={h.changePct} size="sm" />}
            {h.amount != null && <span className={cn('num text-xs', h.amount >= 0 ? 'text-up' : 'text-down')}>{formatBillion(h.amount / 1e9)}</span>}
          </span>
        </div>
      ))}
      <p className="line-clamp-3 rounded-xl border border-dashed border-line-strong px-3.5 py-3 text-[13px] text-dim">{data.sections[2]?.body}</p>
    </div>
  )
}

/* ---------- Bảng lệnh: gõ chữ tự động ---------- */
const TYPE_WORDS = ['FPT', 'thép', 'VCB']
function PaletteWidget() {
  const [text, setText] = useState('')
  const [word, setWord] = useState(0)
  const { data: stocks = [] } = useStocks()

  useEffect(() => {
    const target = TYPE_WORDS[word]
    let i = 0
    let timer
    const tick = () => {
      i += 1
      setText(target.slice(0, i))
      if (i < target.length) timer = setTimeout(tick, 140)
      else timer = setTimeout(() => setWord((w) => (w + 1) % TYPE_WORDS.length), 2200)
    }
    timer = setTimeout(tick, 400)
    return () => clearTimeout(timer)
  }, [word])

  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase()
  const results = text
    ? stocks.filter((s) => s.ticker.toLowerCase().startsWith(text.toLowerCase()) || norm(s.name).includes(norm(text)) || norm(s.sectorName).includes(norm(text))).slice(0, 3)
    : []
  const top = results[0]

  return (
    <div className="overflow-hidden rounded-2xl border border-line-strong bg-raised" aria-hidden>
      <div className="min-h-[164px] p-2">
        {results.map((s, i) => (
          <div key={s.ticker} className={cn('flex items-center gap-3 rounded-xl px-2.5 py-2', i === 0 && 'bg-hover')}>
            <TickerLogo ticker={s.ticker} color={s.color} size={26} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold">{s.ticker}</span>
              <span className="block truncate text-[11px] text-muted">{s.name}</span>
            </span>
            <ChangePill value={s.changePct} size="sm" />
          </div>
        ))}
        {top && (
          <div className="mt-1 flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13px] text-dim">
            <span className="flex size-[26px] items-center justify-center rounded-lg border border-line-strong bg-overlay">
              <FileText className="size-3.5" />
            </span>
            Báo cáo tài chính {top.ticker}
            <Kbd className="ml-auto">F</Kbd>
          </div>
        )}
        {!results.length && <div className="px-3 py-12 text-center text-[13px] text-faint">Gõ mã, tên công ty hoặc ngành…</div>}
      </div>
      <div className="flex h-11 items-center gap-2 border-t border-line bg-surface px-3.5 text-[14px]">
        <Search className="size-4 text-muted" />
        <span className="text-fg">{text}</span>
        <span className="-ml-1.5 h-4 w-px animate-pulse bg-brand" />
        <span className="ml-auto flex gap-1">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </span>
      </div>
    </div>
  )
}

/* ---------- Phân tích doanh nghiệp ---------- */
/** Sparkline co giãn theo chiều rộng khung chứa. */
export function FluidSparkline({ values, className, height = 64 }) {
  const [ref, { width }] = useElementSize()
  return (
    <div ref={ref} className={className}>
      {width > 0 && <Sparkline values={values} width={width} height={height} />}
    </div>
  )
}

function AnalysisWidget() {
  const { data: s } = useStock('FPT')
  const { data: hist } = useStockHistory('FPT', '1Y')
  const { data: an } = useAnalysts('FPT')
  if (!s) return <Skeleton className="h-44" />
  const metrics = [
    ['P/E', formatRatio(s.pe)],
    ['ROE', `${formatRatio(s.roe)}%`],
    ['Vốn hoá', formatBillion(s.marketCap)],
  ]
  return (
    <div className="rounded-2xl border border-line bg-base p-4">
      <div className="flex items-center gap-3">
        <TickerLogo ticker="FPT" color={s.color} size={34} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">FPT</div>
          <div className="truncate text-xs text-muted">{s.name}</div>
        </div>
        <div className="text-right">
          <div className="num font-semibold">{formatPrice(s.price)}</div>
          <ChangePill value={s.perf1Y} size="sm" />
        </div>
      </div>
      <FluidSparkline values={hist?.map((d) => d.value) ?? []} className="mt-3 h-16" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {metrics.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-surface px-3 py-2">
            <div className="text-[11px] text-muted">{k}</div>
            <div className="num truncate text-[13px] font-semibold">{v}</div>
          </div>
        ))}
      </div>
      {an && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-line px-3 py-2 text-[12.5px]">
          <span className="flex items-center gap-1.5 text-muted">
            <Target className="size-3.5" /> Đồng thuận: <span className="font-medium text-fg">{an.consensus}</span>
          </span>
          <span className={cn('num font-medium', an.target.upside >= 0 ? 'text-up' : 'text-down')}>{formatPercent(an.target.upside)} tiềm năng</span>
        </div>
      )}
    </div>
  )
}

/* ---------- Lịch sự kiện ---------- */
const EVENT_TONE = { earnings: 'bg-series-2', dividend: 'bg-up', agm: 'bg-brand', market: 'bg-floor', listing: 'bg-ref', meeting: 'bg-series-5' }
function CalendarWidget() {
  const { data } = useEvents()
  const upcoming = useMemo(() => (data ?? []).filter((e) => !e.done).slice(0, 4), [data])
  if (!data) return <Skeleton className="h-44" />
  return (
    <ul className="space-y-2">
      {upcoming.map((e) => {
        const d = new Date(e.date)
        return (
          <li key={e.id} className="flex items-center gap-3 rounded-xl border border-line bg-base px-3 py-2.5">
            <span className="flex w-10 shrink-0 flex-col items-center rounded-lg bg-surface py-1">
              <span className="text-[10px] text-muted">{weekdayShort(d)}</span>
              <span className="num text-[15px] leading-[1.3] font-semibold">{d.getDate()}</span>
            </span>
            <span className={cn('h-8 w-[3px] shrink-0 rounded-full', EVENT_TONE[e.type] ?? 'bg-faint')} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold">{e.ticker ?? 'Thị trường'}</span>
              <span className="block truncate text-xs text-muted">{e.title}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/* ---------- Bộ lọc ---------- */
function ScreenerWidget() {
  const { data: stocks } = useStocks()
  if (!stocks) return <Skeleton className="h-44" />
  const rows = stocks.filter((s) => s.pe < 16 && s.roe > 14).sort((a, b) => b.roe - a.roe).slice(0, 4)
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {[
          ['P/E', '< 16'],
          ['ROE', '> 14%'],
        ].map(([k, v]) => (
          <span key={k} className="inline-flex h-7 items-center overflow-hidden rounded-full border border-line-strong text-xs">
            <span className="bg-overlay px-2.5 py-1 text-muted">{k}</span>
            <span className="flex items-center gap-1.5 px-2.5 text-fg">
              {v} <X className="size-3 text-faint" />
            </span>
          </span>
        ))}
        <span className="inline-flex h-7 items-center rounded-full border border-dashed border-line-strong px-2.5 text-xs text-muted">+ Thêm điều kiện</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-[1fr_56px_56px_72px] gap-2 bg-base px-3 py-2 text-[11px] text-faint">
          <span>Mã</span>
          <span className="text-right">P/E</span>
          <span className="text-right">ROE</span>
          <span className="text-right">Hôm nay</span>
        </div>
        {rows.map((s) => (
          <div key={s.ticker} className="num grid grid-cols-[1fr_56px_56px_72px] items-center gap-2 border-t border-line px-3 py-2 text-[12.5px]">
            <span className="flex items-center gap-2 font-semibold">
              <TickerLogo ticker={s.ticker} color={s.color} size={20} />
              {s.ticker}
            </span>
            <span className="text-right text-dim">{formatRatio(s.pe)}</span>
            <span className="text-right text-dim">{formatRatio(s.roe)}%</span>
            <span className="flex justify-end">
              <ChangePill value={s.changePct} size="sm" />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Danh mục ---------- */
function WatchWidget() {
  const { data: stocks } = useStocks()
  if (!stocks) return <Skeleton className="h-44" />
  const list = ['MWG', 'HPG', 'VCB', 'DGC'].map((t) => stocks.find((s) => s.ticker === t)).filter(Boolean)
  return (
    <div className="rounded-2xl border border-line bg-base p-2">
      <div className="flex items-center justify-between px-2 pt-1 pb-2 text-[11px] text-faint">
        <span>Cổ phiếu theo dõi</span>
        <span>1 tháng</span>
      </div>
      {list.map((s) => (
        <div key={s.ticker} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface">
          <TickerLogo ticker={s.ticker} color={s.color} size={26} />
          <span className="min-w-0 flex-1 text-[13px] font-semibold">{s.ticker}</span>
          <span className="num text-[12.5px] text-dim">{formatPrice(s.price)}</span>
          <ChangePill value={s.perf1M} size="sm" className="w-16" />
        </div>
      ))}
    </div>
  )
}

/** Lưới tính năng (bento) với widget chạy dữ liệu thật. */
export function Features() {
  return (
    <section id="tinh-nang" className="container-app scroll-mt-24 py-24 sm:py-32" aria-labelledby="tinh-nang-title">
      <div className="mx-auto max-w-2xl text-center">
        <div className="ds-label">Tính năng</div>
        <h2 id="tinh-nang-title" className="mt-3 text-3xl leading-tight font-bold tracking-tight sm:text-[42px]">
          Mọi thứ nhà đầu tư cần, <span className="text-gradient">gói gọn trong một nhịp</span>
        </h2>
        <p className="mt-4 text-[15px] text-muted">Không còn mở mười tab trình duyệt mỗi sáng. Nhịp gom dữ liệu thị trường, doanh nghiệp và lịch sự kiện vào một giao diện gọn gàng, thao tác hoàn toàn bằng bàn phím.</p>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <FeatureCard icon={Sparkles} eyebrow="Bản tin sáng AI" title="Hiểu thị trường trong 3 phút" description="Tóm tắt diễn biến chỉ số, dòng tiền khối ngoại và nhóm ngành nổi bật — sẵn sàng trước giờ mở cửa.">
          <RecapWidget />
        </FeatureCard>
        <FeatureCard icon={Command} eyebrow="Bảng lệnh Ctrl K" title="Nhanh như suy nghĩ" description="Tìm mã, mở báo cáo, chuyển trang, thêm vào danh sách theo dõi — tất cả chỉ bằng vài phím." className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.1fr_1fr] md:items-center">
            <PaletteWidget />
            <ul className="space-y-3 text-sm text-dim">
              {[
                ['/', 'Tìm cổ phiếu ở bất kỳ đâu'],
                ['W', 'Mở nhanh danh sách theo dõi'],
                ['G H', 'Về trang Tổng quan'],
                ['?', 'Xem toàn bộ phím tắt'],
              ].map(([k, t]) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex gap-1">
                    {k.split(' ').map((x) => (
                      <Kbd key={x}>{x}</Kbd>
                    ))}
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </FeatureCard>
        <FeatureCard icon={BarChart3} eyebrow="Phân tích doanh nghiệp" title="Đi sâu vào từng con số" description="Báo cáo tài chính 12 quý, kết quả so với dự phóng, khuyến nghị từ các công ty chứng khoán và so sánh cùng ngành.">
          <AnalysisWidget />
        </FeatureCard>
        <FeatureCard icon={CalendarDays} eyebrow="Lịch sự kiện & cổ tức" title="Không bỏ lỡ ngày quan trọng" description="KQKD, ĐHCĐ, ngày GDKHQ cổ tức và đáo hạn phái sinh — lọc riêng theo danh mục của bạn.">
          <CalendarWidget />
        </FeatureCard>
        <FeatureCard icon={ListFilter} eyebrow="Bộ lọc cổ phiếu" title="Tìm cơ hội theo tiêu chí của bạn" description="Kết hợp định giá, hiệu quả và hiệu suất giá; lưu thành mẫu để dùng lại bất cứ lúc nào.">
          <ScreenerWidget />
        </FeatureCard>
        <FeatureCard icon={Star} eyebrow="Danh mục theo dõi" title="Theo dõi điều bạn quan tâm" description="Nhóm cổ phiếu theo danh sách riêng, so sánh với VN-Index và theo dõi lãi lỗ vị thế đang nắm giữ." className="md:col-span-2 lg:col-span-1">
          <WatchWidget />
        </FeatureCard>
      </div>
    </section>
  )
}
