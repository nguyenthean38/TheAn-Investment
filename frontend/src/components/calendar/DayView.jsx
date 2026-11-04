import { ArrowUpRight, CalendarX2, Info } from 'lucide-react'
import { Button, ChangePill, EmptyState, ExchangeBadge, Skeleton, TickerLogo } from '@/components/ui'
import { useStock } from '@/hooks/useMarket'
import { formatPrice } from '@/utils/format'
import { EventRow } from './EventItems'
import { MiniCalendar } from './MiniCalendar'
import { SESSION_LABEL } from './calendarUtils'

/** Thẻ thông tin doanh nghiệp của sự kiện đang chọn. */
function CompanyCard({ event }) {
  const { data, isLoading } = useStock(event?.ticker)
  if (!event) return null
  if (!event.ticker) {
    return (
      <div className="card p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Info className="size-4 text-ref" /> {event.title}
        </div>
        <p className="text-sm leading-relaxed text-muted">
          Hợp đồng tương lai chỉ số VN30 đáo hạn vào ngày thứ Năm thứ ba của tháng. Phiên đáo hạn thường có thanh khoản cao và biến động mạnh ở nhóm cổ phiếu vốn hoá lớn, đặc biệt trong đợt khớp lệnh ATC.
        </p>
      </div>
    )
  }
  return (
    <div className="card p-5">
      {isLoading || !data ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-20" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <TickerLogo ticker={data.ticker} color={data.color} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{data.ticker}</span>
                <ExchangeBadge exchange={data.exchange} />
              </div>
              <div className="truncate text-xs text-muted">{data.name}</div>
            </div>
            <div className="text-right">
              <div className="num text-sm font-semibold">{formatPrice(data.price)}</div>
              <ChangePill value={data.changePct} size="sm" />
            </div>
          </div>
          <h3 className="mt-5 mb-1.5 text-[13px] font-semibold text-dim">Về {data.ticker}</h3>
          <p className="line-clamp-5 text-sm leading-relaxed text-muted">{data.profile?.about}</p>
          <Button to={`/app/co-phieu/${data.ticker}`} variant="secondary" size="sm" className="mt-5">
            Xem cổ phiếu <ArrowUpRight className="size-4" />
          </Button>
        </>
      )}
    </div>
  )
}

/** Chế độ Ngày: danh sách trước/sau giờ giao dịch + lịch mini + thẻ doanh nghiệp. */
export function DayView({ date, events, byDay, onSelectDate, selectedId, onSelectEvent }) {
  const selected = events.find((e) => e.id === selectedId) ?? events.find((e) => e.ticker) ?? events[0]
  const groups = ['pre', 'post'].map((s) => ({ s, items: events.filter((e) => (e.session ?? 'pre') === s) })).filter((g) => g.items.length)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="card min-h-[420px] p-3 sm:p-4">
        {groups.length === 0 ? (
          <EmptyState icon={CalendarX2} title="Không có sự kiện trong ngày" description="Thử chọn ngày khác trên lịch, hoặc bỏ bớt bộ lọc đang bật." />
        ) : (
          groups.map((g) => (
            <section key={g.s} className="mb-3 last:mb-0">
              <h3 className="ds-label flex items-center justify-between px-2 pt-2 pb-2">
                {SESSION_LABEL[g.s]}
                <span className="normal-case tracking-normal text-faint">{g.items.length} sự kiện</span>
              </h3>
              <div className="space-y-1">
                {g.items.map((e) => (
                  <EventRow key={e.id} event={e} active={selected?.id === e.id} onSelect={() => onSelectEvent(e.id)} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
      <aside className="space-y-4">
        <MiniCalendar selected={date} onSelect={onSelectDate} byDay={byDay} />
        <CompanyCard key={selected?.id} event={selected} />
      </aside>
    </div>
  )
}
