import { vnNow } from '@/lib/time'

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
export const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
export const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6

/** Đưa ngày cuối tuần về ngày làm việc gần nhất (dir > 0: tiến tới thứ hai; dir < 0: lùi về thứ sáu). */
export function toWeekday(d, dir = 0) {
  const g = d.getDay()
  if (g === 6) return addDays(d, dir > 0 ? 2 : -1)
  if (g === 0) return addDays(d, dir < 0 ? -2 : 1)
  return d
}

export const todayVn = () => startOfDay(vnNow())
export const startOfWeek = (d) => addDays(d, -((d.getDay() + 6) % 7))
export const weekDays = (d) => [0, 1, 2, 3, 4].map((i) => addDays(startOfWeek(d), i))

/** Các tuần (T2–T6) phủ tháng của `d`, bỏ tuần không có ngày nào thuộc tháng. */
export function monthWeeks(d) {
  const m = d.getMonth()
  const first = new Date(d.getFullYear(), m, 1)
  const last = new Date(d.getFullYear(), m + 1, 0)
  const weeks = []
  for (let s = startOfWeek(first); s <= last; s = addDays(s, 7)) {
    const days = [0, 1, 2, 3, 4].map((i) => addDays(s, i))
    if (days.some((x) => x.getMonth() === m)) weeks.push(days)
  }
  return weeks
}

/** Lưới 7 cột cho lịch mini. */
export function monthGrid(d) {
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  const cells = []
  for (let s = startOfWeek(first); s <= last || cells.length % 7; s = addDays(s, 1)) cells.push(s)
  return cells
}

export function groupByDay(events) {
  const map = new Map()
  events.forEach((e) => {
    const k = dayKey(new Date(e.date))
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(e)
  })
  return map
}

/** Loại sự kiện: nhãn, tông màu chip, màu chấm. */
export const EVENT_TYPES = {
  earnings: { label: 'KQKD', long: 'Kết quả kinh doanh', tone: 'brand', dot: 'bg-brand' },
  dividend: { label: 'Cổ tức', long: 'Chia cổ tức', tone: 'up', dot: 'bg-up' },
  agm: { label: 'ĐHCĐ', long: 'Đại hội cổ đông', tone: 'info', dot: 'bg-info' },
  listing: { label: 'Niêm yết', long: 'Niêm yết bổ sung', tone: 'ceil', dot: 'bg-ceil' },
  meeting: { label: 'Gặp NĐT', long: 'Gặp gỡ nhà đầu tư', tone: 'floor', dot: 'bg-floor' },
  market: { label: 'Thị trường', long: 'Sự kiện thị trường', tone: 'ref', dot: 'bg-ref' },
}
export const TYPE_IDS = Object.keys(EVENT_TYPES)

export const SESSION_LABEL = { pre: 'Trước giờ giao dịch', post: 'Sau giờ giao dịch' }
export const SESSION_SHORT = { pre: 'Trước 9:00', post: 'Sau 15:00' }

export const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`)
export const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export const fmtDM = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
