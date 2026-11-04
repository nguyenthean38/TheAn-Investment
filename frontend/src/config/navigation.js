import { CalendarDays, Compass, Home, LineChart, ListFilter, Settings, Star } from 'lucide-react'

/**
 * Điều hướng chính (thanh dock nổi). `keys`: chuỗi phím tắt "G rồi …".
 * `icon: 'calendar'` → dock vẽ ngày hiện tại lên icon.
 */
export const DOCK_ITEMS = [
  { to: '/app', label: 'Tổng quan', icon: Home, keys: ['G', 'H'], end: true },
  { to: '/app/phan-tich', label: 'Phân tích', icon: Compass, keys: ['G', 'A'] },
  { to: '/app/lich', label: 'Lịch sự kiện', icon: CalendarDays, keys: ['G', 'C'], calendar: true },
  { to: '/app/danh-muc', label: 'Danh mục', icon: Star, keys: ['G', 'W'] },
  { to: '/app/so-sanh', label: 'So sánh', icon: LineChart, keys: ['G', 'G'] },
  { to: '/app/bo-loc', label: 'Bộ lọc cổ phiếu', icon: ListFilter, keys: ['G', 'S'] },
  { to: '/app/cai-dat', label: 'Cài đặt', icon: Settings, keys: ['G', ','] },
]

/** Bảng phím tắt hiển thị trong ngăn "Phím tắt" (?) */
export const SHORTCUT_GROUPS = [
  {
    title: 'Chung',
    items: [
      { label: 'Mở bảng lệnh', keys: ['Ctrl', 'K'] },
      { label: 'Tìm cổ phiếu', keys: ['/'] },
      { label: 'Mở danh sách theo dõi', keys: ['W'] },
      { label: 'Bảng phím tắt', keys: ['?'] },
      { label: 'Đóng cửa sổ', keys: ['Esc'] },
    ],
  },
  {
    title: 'Trang cổ phiếu',
    items: [
      { label: 'Theo dõi / bỏ theo dõi', keys: ['B'] },
      { label: 'Mở Phân tích AI', keys: ['X'] },
      { label: 'Chuyển khung thời gian', keys: ['[', ']'] },
      { label: 'Tới mục Khuyến nghị', keys: ['A'] },
      { label: 'Tới mục Kết quả kinh doanh', keys: ['E'] },
      { label: 'Tới mục Tài chính', keys: ['F'] },
      { label: 'Tới mục Cùng ngành', keys: ['P'] },
    ],
  },
  {
    title: 'Chuyển trang',
    items: DOCK_ITEMS.map((d) => ({ label: `Tới ${d.label}`, keys: d.keys, then: true })),
  },
]
