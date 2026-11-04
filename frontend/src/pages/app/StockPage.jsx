import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GitCompareArrows, SearchX, Sparkles, Star } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { Button, Card, EmptyState, ErrorState, ExchangeBadge, IconButton, Kbd, Skeleton, TickerLogo, Tooltip } from '@/components/ui'
import { useHotkeys } from '@/hooks/useHotkeys'
import { usePeers, useStock } from '@/hooks/useMarket'
import { useToggleWatch, useWatchedSet } from '@/hooks/useWatchlists'
import { useUI } from '@/store/ui'
import { recentTickers } from '@/utils/recent'
import { cn } from '@/utils/cn'
import { PricePanel } from '@/components/stock/PricePanel'
import { InfoTabsCard } from '@/components/stock/InfoTabsCard'
import { MetricsStrip } from '@/components/stock/MetricsStrip'
import { AnalystSection } from '@/components/stock/AnalystSection'
import { EarningsSection } from '@/components/stock/EarningsSection'
import { FinancialsSection } from '@/components/stock/FinancialsSection'
import { InsiderSection } from '@/components/stock/InsiderSection'
import { ForeignSection } from '@/components/stock/ForeignSection'
import { PeersSection } from '@/components/stock/PeersSection'
import { AnalysisModal } from '@/components/stock/AnalysisModal'
import { SharePopover } from '@/components/stock/SharePopover'
import { RANGE_OPTIONS } from '@/components/stock/shared'

const SECTION_NAV = [
  { id: 'khuyen-nghi', label: 'Khuyến nghị', key: 'A' },
  { id: 'ket-qua', label: 'Kết quả KD', key: 'E' },
  { id: 'tai-chinh', label: 'Tài chính', key: 'F' },
  { id: 'noi-bo', label: 'Nội bộ' },
  { id: 'khoi-ngoai', label: 'Khối ngoại' },
  { id: 'cung-nganh', label: 'Cùng ngành', key: 'P' },
]

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

/** Trang chi tiết cổ phiếu: /app/co-phieu/:ticker */
export default function StockPage() {
  const { ticker: raw = '' } = useParams()
  const ticker = raw.toUpperCase()
  const navigate = useNavigate()
  const { data: stock, isLoading, error, refetch } = useStock(ticker)
  const { data: peers } = usePeers(stock ? ticker : null)
  const watched = useWatchedSet()
  const toggleWatch = useToggleWatch()
  const openPalette = useUI((s) => s.openPalette)
  const [range, setRange] = useState('1D')
  const [analysisOpen, setAnalysisOpen] = useState(false)

  useEffect(() => {
    if (stock) {
      recentTickers.push(stock.ticker)
      document.title = `${stock.ticker} — ${stock.name} · Nhịp`
    }
    return () => {
      document.title = 'Nhịp — Nghiên cứu cổ phiếu thông minh'
    }
  }, [stock])

  const cycle = (dir) => {
    const i = RANGE_OPTIONS.findIndex((o) => o.value === range)
    setRange(RANGE_OPTIONS[(i + dir + RANGE_OPTIONS.length) % RANGE_OPTIONS.length].value)
  }

  useHotkeys(
    {
      b: () => toggleWatch.mutate(ticker),
      '[': () => cycle(-1),
      ']': () => cycle(1),
      a: () => scrollTo('khuyen-nghi'),
      e: () => scrollTo('ket-qua'),
      f: () => scrollTo('tai-chinh'),
      p: () => scrollTo('cung-nganh'),
      x: () => setAnalysisOpen(true),
    },
    { enabled: !!stock },
  )

  if (isLoading) return <StockSkeleton />

  if (error || !stock) {
    const notFound = error?.status === 404
    return (
      <>
        <AppHeader back="/app" title="Cổ phiếu" />
        <div className="container-app">
          <Card>
            {notFound ? (
              <EmptyState
                icon={SearchX}
                title={`Không tìm thấy mã "${ticker}"`}
                description="Mã này chưa có trên Nhịp hoặc đã huỷ niêm yết. Hãy thử tìm mã khác."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="primary" onClick={() => openPalette('search')}>
                      Tìm cổ phiếu <Kbd className="ml-1 border-black/20 bg-black/10 text-canvas">/</Kbd>
                    </Button>
                    <Button variant="ghost" to="/app">
                      Về Tổng quan
                    </Button>
                  </div>
                }
              />
            ) : (
              <ErrorState error={error} onRetry={refetch} />
            )}
          </Card>
        </div>
      </>
    )
  }

  const isWatched = watched.has(stock.ticker)
  const compareList = [stock.ticker, ...(peers ?? []).map((p) => p.ticker).filter((t) => t !== stock.ticker).slice(0, 2)]

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 h-[520px] opacity-70"
        style={{ background: `radial-gradient(55% 60% at 30% 0%, ${stock.color}38, transparent 70%)` }}
        aria-hidden
      />
      <div className="relative">
        <AppHeader
          back="/app"
          showStatus={false}
          title={
            <div className="flex min-w-0 items-center gap-3">
              <TickerLogo ticker={stock.ticker} color={stock.color} size={40} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-[22px] leading-[1.3] font-bold tracking-tight">{stock.ticker}</h1>
                  <ExchangeBadge exchange={stock.exchange} />
                </div>
                <p className="truncate text-[13px] text-muted">
                  {stock.name} · {stock.sectorName}
                </p>
              </div>
            </div>
          }
          actions={
            <>
              <Button variant="secondary" size="md" onClick={() => setAnalysisOpen(true)} className="hidden sm:inline-flex">
                <Sparkles className="size-4 text-brand" /> Phân tích AI <Kbd className="ml-0.5">X</Kbd>
              </Button>
              <Button variant="secondary" size="md" icon aria-label="Phân tích AI" onClick={() => setAnalysisOpen(true)} className="sm:hidden">
                <Sparkles className="size-4 text-brand" />
              </Button>
              <Tooltip label="So sánh với cùng ngành" side="bottom">
                <IconButton aria-label="So sánh" onClick={() => navigate(`/app/so-sanh?tickers=${compareList.join(',')}`)}>
                  <GitCompareArrows className="size-[18px]" />
                </IconButton>
              </Tooltip>
              <SharePopover stock={stock} />
              <Tooltip label={<span className="flex items-center gap-2">{isWatched ? 'Bỏ theo dõi' : 'Theo dõi'} <Kbd>B</Kbd></span>} side="bottom">
                <IconButton aria-label={isWatched ? 'Bỏ theo dõi' : 'Theo dõi'} aria-pressed={isWatched} active={isWatched} onClick={() => toggleWatch.mutate(stock.ticker)}>
                  <Star className={cn('size-[18px]', isWatched && 'fill-current')} />
                </IconButton>
              </Tooltip>
            </>
          }
        />

        <main className="container-app space-y-14">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
            <Card className="p-5 sm:p-6">
              <PricePanel stock={stock} range={range} onRangeChange={setRange} />
            </Card>
            <InfoTabsCard stock={stock} />
          </div>

          <div className="!mt-6">
            <MetricsStrip stock={stock} />
          </div>

          <nav aria-label="Mục lục" className="sticky top-3 z-20 !mt-8 flex justify-center">
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-line-strong bg-raised/85 p-1 shadow-xl backdrop-blur-xl scrollbar-none">
              {SECTION_NAV.map((s) => (
                <button key={s.id} type="button" onClick={() => scrollTo(s.id)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-muted transition-colors hover:bg-overlay hover:text-fg">
                  {s.label}
                  {s.key && <Kbd className="hidden sm:inline-flex">{s.key}</Kbd>}
                </button>
              ))}
            </div>
          </nav>

          <AnalystSection stock={stock} />
          <EarningsSection stock={stock} />
          <FinancialsSection stock={stock} />
          <InsiderSection stock={stock} />
          <ForeignSection stock={stock} />
          <PeersSection stock={stock} />
        </main>
      </div>

      <AnalysisModal open={analysisOpen} onClose={() => setAnalysisOpen(false)} stock={stock} />
    </div>
  )
}

function StockSkeleton() {
  return (
    <div className="container-app pt-6">
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Skeleton className="h-[560px] rounded-[18px]" />
        <Skeleton className="h-[560px] rounded-3xl" />
      </div>
      <Skeleton className="mt-6 h-20 rounded-2xl" />
    </div>
  )
}
