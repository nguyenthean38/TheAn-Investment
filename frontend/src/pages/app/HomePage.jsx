import { AppHeader } from '@/components/layout/AppHeader'
import { MarketCard } from '@/components/home/MarketCard'
import { RecapCard } from '@/components/home/RecapCard'
import { ForeignCard, MoversCard, UpcomingEvents } from '@/components/home/SideCards'
import { NewsFeed } from '@/components/home/NewsFeed'
import { useMe } from '@/hooks/useAuth'
import { greeting } from '@/lib/time'

/** Tổng quan: thị trường + bản tin + sự kiện + cổ phiếu nổi bật + khối ngoại + tin tức. */
export default function HomePage() {
  const { data: me } = useMe()
  return (
    <>
      <AppHeader title={`${greeting()}, ${me?.name ?? 'bạn'}`} />
      <main className="container-app grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <MarketCard />
        </div>
        <div className="min-w-0 space-y-6">
          <RecapCard />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <UpcomingEvents />
            <MoversCard />
          </div>
          <ForeignCard />
          <NewsFeed />
        </div>
      </main>
    </>
  )
}
