import { vnNow } from '@/lib/time'

/** Định dạng số/ngày theo chuẩn Việt Nam (dấu chấm ngăn nghìn, dấu phẩy thập phân). */
const nf = (min, max = min) => new Intl.NumberFormat('vi-VN', { minimumFractionDigits: min, maximumFractionDigits: max })
const n0 = nf(0)
const n1 = nf(1)
const n2 = nf(2)

let priceUnit = 'dong'
/** Đổi đơn vị hiển thị giá toàn cục: 'dong' (128.400) | 'k' (128,4 — giống bảng điện). */
export function setPriceUnit(unit) {
  priceUnit = unit === 'k' ? 'k' : 'dong'
}
const nK = nf(1, 2)

/** Giá cổ phiếu: 128.400 (hoặc 128,4 khi người dùng chọn đơn vị nghìn đồng) */
export function formatPrice(v) {
  if (v == null || Number.isNaN(v)) return '—'
  if (priceUnit === 'k') return nK.format(v / 1000)
  return n0.format(Math.round(v))
}

/** Giá theo đơn vị nghìn đồng như bảng điện: 128,4 */
export function formatPriceK(v) {
  if (v == null) return '—'
  return n2.format(v / 1000)
}

/** Điểm chỉ số: 1.286,42 */
export function formatPoint(v) {
  if (v == null) return '—'
  return n2.format(v)
}

export function formatNumber(v, digits = 0) {
  if (v == null || Number.isNaN(v)) return '—'
  return nf(0, digits).format(v)
}

/** +1,25% ; dùng `sign: false` để bỏ dấu + */
export function formatPercent(v, { sign = true, digits = 2 } = {}) {
  if (v == null || Number.isNaN(v)) return '—'
  const s = nf(digits).format(Math.abs(v))
  if (!sign) return `${v < 0 ? '-' : ''}${s}%`
  return `${v > 0 ? '+' : v < 0 ? '-' : ''}${s}%`
}

/** +1.200 / -350 */
export function formatChange(v, digits = 0) {
  if (v == null || Number.isNaN(v)) return '—'
  const s = nf(0, digits).format(Math.abs(digits ? v : Math.round(v)))
  return `${v > 0 ? '+' : v < 0 ? '-' : ''}${s}`
}

/** Tỷ đồng → "12.345 tỷ" / "1,2 nghìn tỷ" (đầu vào: tỷ đồng) */
export function formatBillion(v, { compact = true } = {}) {
  if (v == null || Number.isNaN(v)) return '—'
  const a = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (compact && a >= 1000) return `${sign}${n1.format(a / 1000)} nghìn tỷ`
  if (a < 10) return `${sign}${n2.format(a)} tỷ`
  return `${sign}${n0.format(a)} tỷ`
}

/** Khối lượng: 1,2 tr ; 845,3 N */
export function formatVolume(v) {
  if (v == null) return '—'
  const a = Math.abs(v)
  if (a >= 1e9) return `${n1.format(v / 1e9)} tỷ`
  if (a >= 1e6) return `${n1.format(v / 1e6)} tr`
  if (a >= 1e3) return `${n1.format(v / 1e3)} N`
  return n0.format(v)
}

/** Giá trị đồng → "1.234 tỷ" (đầu vào: đồng) */
export function formatValueVnd(v) {
  if (v == null) return '—'
  return formatBillion(v / 1e9)
}

export function formatRatio(v, digits = 1) {
  if (v == null || Number.isNaN(v) || !Number.isFinite(v)) return '—'
  return nf(digits).format(v)
}

const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
const WEEKDAYS_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export const weekdayName = (d) => WEEKDAYS[new Date(d).getDay()]
export const weekdayShort = (d) => WEEKDAYS_SHORT[new Date(d).getDay()]

/** 25/02/2025 */
export function formatDate(d, opts = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN', opts)
}

/** "Thứ ba, 25 tháng 2" */
export function formatLongDate(d) {
  const x = new Date(d)
  return `${weekdayName(x)}, ${x.getDate()} tháng ${x.getMonth() + 1}`
}

/** "25 thg 2, 2025" */
export function formatMediumDate(d, withYear = true) {
  const x = new Date(d)
  return `${x.getDate()} thg ${x.getMonth() + 1}${withYear ? `, ${x.getFullYear()}` : ''}`
}

export function formatTime(d) {
  const x = new Date(d)
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`
}

/** "12 phút trước", "3 giờ trước", "Hôm qua" */
export function timeAgo(d, now = vnNow().getTime()) {
  const diff = Math.max(0, now - new Date(d).getTime())
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const days = Math.floor(h / 24)
  if (days === 1) return 'Hôm qua'
  if (days < 7) return `${days} ngày trước`
  return formatDate(d)
}

/** Chiều biến động → tên token màu: up/down/ref */
export function trend(v) {
  if (v == null || Math.abs(v) < 1e-9) return 'ref'
  return v > 0 ? 'up' : 'down'
}
