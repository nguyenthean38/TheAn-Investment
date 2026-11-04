import { CalendarClock } from 'lucide-react'
import { Chip, TickerLogo } from '@/components/ui'
import { formatNumber } from '@/utils/format'
import { cn } from '@/utils/cn'
import { EVENT_TYPES, SESSION_SHORT } from './calendarUtils'

/** Logo cho sự kiện (mã cổ phiếu hoặc biểu tượng thị trường). */
export function EventLogo({ event, size = 32 }) {
  if (event.ticker) return <TickerLogo ticker={event.ticker} color={event.color} size={size} />
  return (
    <span className="flex shrink-0 items-center justify-center rounded-[30%] border border-ref/30 bg-ref/10 text-ref" style={{ width: size, height: size }} aria-hidden>
      <CalendarClock className="size-4" />
    </span>
  )
}

/** Kết quả KQKD: Vượt / Hụt dự phóng. */
export function OutcomeChip({ event, className }) {
  if (event.type !== 'earnings' || !event.done || event.actualEps == null) return null
  return (
    <Chip tone={event.beat ? 'up' : 'down'} className={className}>
      {event.beat ? 'Vượt' : 'Hụt'}
    </Chip>
  )
}

/** Dòng EPS dự phóng / thực tế cho sự kiện KQKD. */
export function EpsLine({ event, className }) {
  if (event.type !== 'earnings') return null
  return (
    <span className={cn('num text-xs text-muted', className)}>
      EPS dự phóng <span className="text-dim">{formatNumber(event.estEps)}</span>
      {event.actualEps != null && (
        <>
          {' · '}thực tế <span className={event.beat ? 'text-up' : 'text-down'}>{formatNumber(event.actualEps)}</span>
        </>
      )}
    </span>
  )
}

/** Dòng sự kiện đầy đủ (chế độ Ngày). */
export function EventRow({ event, active, onSelect }) {
  const meta = EVENT_TYPES[event.type] ?? EVENT_TYPES.market
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors sm:px-4',
        active ? 'border-brand/40 bg-brand/[0.05]' : 'border-transparent hover:bg-raised',
      )}
    >
      <EventLogo event={event} size={36} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-semibold text-fg">{event.ticker ?? 'Thị trường'}</span>
          <span className="truncate text-xs text-muted">{event.name}</span>
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-dim">{event.title}</span>
        <EpsLine event={event} className="mt-0.5 block" />
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <Chip tone={meta.tone}>{meta.label}</Chip>
        <OutcomeChip event={event} />
        {!(event.type === 'earnings' && event.done) && <span className="text-[11px] text-faint">{SESSION_SHORT[event.session] ?? ''}</span>}
      </span>
    </button>
  )
}

/** Viên sự kiện gọn (chế độ Tuần / Tháng). */
export function EventPill({ event, onClick, compact = false }) {
  const meta = EVENT_TYPES[event.type] ?? EVENT_TYPES.market
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${event.ticker ?? 'Thị trường'} — ${event.title}`}
      className="flex w-full min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-hover"
    >
      {compact ? <span className={cn('size-1.5 shrink-0 rounded-full', meta.dot)} /> : <EventLogo event={event} size={20} />}
      <span className="min-w-0 flex-1 truncate text-xs">
        <span className="font-semibold text-fg">{event.ticker ?? 'Phái sinh'}</span> <span className="text-muted">{meta.label}</span>
      </span>
      {event.type === 'earnings' && event.done && <span className={cn('text-[10.5px] font-medium', event.beat ? 'text-up' : 'text-down')}>{event.beat ? 'Vượt' : 'Hụt'}</span>}
    </button>
  )
}
