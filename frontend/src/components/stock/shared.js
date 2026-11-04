/** Hằng số & tiện ích dùng chung cho trang cổ phiếu. */
export const RANGE_OPTIONS = [
  { value: '1D', label: '1N' },
  { value: '1W', label: '1T' },
  { value: '1M', label: '1TH' },
  { value: '3M', label: '3TH' },
  { value: '6M', label: '6TH' },
  { value: 'YTD', label: 'YTD' },
  { value: '1Y', label: '1NĂM' },
  { value: '3Y', label: '3NĂM' },
]

export const RANGE_TEXT = {
  '1D': 'hôm nay',
  '1W': 'trong 1 tuần',
  '1M': 'trong 1 tháng',
  '3M': 'trong 3 tháng',
  '6M': 'trong 6 tháng',
  YTD: 'từ đầu năm',
  '1Y': 'trong 1 năm',
  '3Y': 'trong 3 năm',
}

export const RATING_LABEL = {
  strong_buy: 'Mua mạnh',
  buy: 'Mua',
  hold: 'Trung lập',
  sell: 'Kém khả quan',
  strong_sell: 'Bán',
}

export const RATING_COLOR = {
  strong_buy: '#2fd28a',
  buy: '#7ee0ad',
  hold: '#f2c94c',
  sell: '#ff9a7a',
  strong_sell: '#ff5a6a',
}

export const ACTION_LABEL = {
  init: 'Khởi tạo',
  upgrade: 'Nâng',
  downgrade: 'Hạ',
  reiterate: 'Giữ nguyên',
}

export const pct = (a, b) => (b ? ((a - b) / Math.abs(b)) * 100 : null)

export const dateTick = (t) => {
  const d = new Date(t)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`
}
export const timeTick = (t) => {
  const d = new Date(t)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
