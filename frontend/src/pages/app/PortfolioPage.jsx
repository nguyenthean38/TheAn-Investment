import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Briefcase, Star } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { ErrorState, Tabs } from '@/components/ui'
import { WatchlistChart } from '@/components/portfolio/WatchlistChart'
import { RelatedEvents } from '@/components/portfolio/RelatedEvents'
import { WatchlistManager } from '@/components/portfolio/WatchlistManager'
import { HoldingsTab } from '@/components/portfolio/HoldingsTab'
import { useStocks } from '@/hooks/useMarket'
import { useHoldings, useWatchlists } from '@/hooks/useWatchlists'

const TAB_IDS = ['theo-doi', 'nam-giu']

/** Danh mục: danh sách theo dõi + danh mục nắm giữ (đồng bộ ?tab=). */
export default function PortfolioPage() {
  const [params, setParams] = useSearchParams()
  const tab = TAB_IDS.includes(params.get('tab')) ? params.get('tab') : 'theo-doi'
  const setTab = (v) =>
    setParams(
      (p) => {
        p.set('tab', v)
        return p
      },
      { replace: true },
    )

  const { data: lists, isLoading: listsLoading, error: listsError, refetch } = useWatchlists()
  const { data: holdings } = useHoldings()
  const { data: stocks = [], isLoading: stocksLoading } = useStocks()
  const byTicker = useMemo(() => new Map(stocks.map((s) => [s.ticker, s])), [stocks])
  const watched = [...new Set((lists ?? []).flatMap((l) => l.tickers))]

  return (
    <>
      <AppHeader title="Danh mục" subtitle="Theo dõi cổ phiếu quan tâm và quản lý các vị thế bạn đang nắm giữ" />
      <main className="container-app">
        <Tabs
          className="mb-6"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'theo-doi', label: 'Danh sách theo dõi', icon: Star, badge: watched.length || undefined },
            { value: 'nam-giu', label: 'Danh mục nắm giữ', icon: Briefcase, badge: holdings?.length || undefined },
          ]}
        />

        {tab === 'theo-doi' ? (
          listsError ? (
            <div className="card">
              <ErrorState error={listsError} onRetry={refetch} />
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
              <div className="order-2 space-y-5 xl:order-1">
                <WatchlistChart lists={lists ?? []} />
                <RelatedEvents tickers={watched} />
              </div>
              <div className="order-1 xl:sticky xl:top-6 xl:order-2">
                <WatchlistManager lists={lists} isLoading={listsLoading || stocksLoading} byTicker={byTicker} />
              </div>
            </div>
          )
        ) : (
          <HoldingsTab byTicker={byTicker} stocksLoading={stocksLoading} />
        )}
      </main>
    </>
  )
}
