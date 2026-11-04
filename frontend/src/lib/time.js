/** Thời gian theo múi giờ Việt Nam (UTC+7) — dùng chung cho UI và mock API. */
export function vnNow() {
  const d = new Date()
  return new Date(d.getTime() + (d.getTimezoneOffset() + 420) * 60000)
}

export const isWeekday = (d) => d.getDay() !== 0 && d.getDay() !== 6

/** Trạng thái phiên: pre | ato | open | lunch | atc | pt | closed */
export function marketSession(now = vnNow()) {
  if (!isWeekday(now)) return { code: 'closed', label: 'Nghỉ cuối tuần', open: false }
  const m = now.getHours() * 60 + now.getMinutes()
  if (m < 9 * 60) return { code: 'pre', label: 'Chưa mở cửa', open: false }
  if (m < 9 * 60 + 15) return { code: 'ato', label: 'Phiên ATO', open: true }
  if (m < 11 * 60 + 30) return { code: 'open', label: 'Phiên sáng', open: true }
  if (m < 13 * 60) return { code: 'lunch', label: 'Nghỉ trưa', open: false }
  if (m < 14 * 60 + 30) return { code: 'open', label: 'Phiên chiều', open: true }
  if (m < 14 * 60 + 45) return { code: 'atc', label: 'Phiên ATC', open: true }
  if (m < 15 * 60) return { code: 'pt', label: 'Giao dịch thoả thuận', open: true }
  return { code: 'closed', label: 'Đã đóng cửa', open: false }
}

/** Lời chào theo giờ. */
export function greeting(now = vnNow()) {
  const h = now.getHours()
  if (h < 11) return 'Chào buổi sáng'
  if (h < 14) return 'Chào buổi trưa'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}
