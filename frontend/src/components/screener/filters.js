import { SECTORS } from '@/api/mock/seed/stocks'

const range = (field, lo, hi) => (s) => s[field] != null && (lo == null || s[field] >= lo) && (hi == null || s[field] < hi)

const perfOptions = (field) => [
  { value: 'high', label: 'Cao (> 5%)', test: range(field, 5, null) },
  { value: 'up', label: 'Tăng (0% – 5%)', test: range(field, 0, 5) },
  { value: 'down', label: 'Giảm (-5% – 0%)', test: range(field, -5, 0) },
  { value: 'low', label: 'Thấp (< -5%)', test: range(field, null, -5) },
]

/** Định nghĩa bộ lọc: id dùng trong URL (?f=id:value,…). */
export const FILTER_DEFS = [
  {
    id: 'exchange',
    label: 'Sàn',
    options: ['HOSE', 'HNX', 'UPCOM'].map((x) => ({ value: x, label: x, test: (s) => s.exchange === x })),
  },
  {
    id: 'sector',
    label: 'Ngành',
    options: SECTORS.map((x) => ({ value: x.id, label: x.name, test: (s) => s.sector === x.id })),
  },
  {
    id: 'cap',
    label: 'Vốn hoá',
    options: [
      { value: 'large', label: 'Lớn (> 10.000 tỷ)', test: range('marketCap', 10000, null) },
      { value: 'mid', label: 'Vừa (1.000 – 10.000 tỷ)', test: range('marketCap', 1000, 10000) },
      { value: 'small', label: 'Nhỏ (< 1.000 tỷ)', test: range('marketCap', null, 1000) },
    ],
  },
  {
    id: 'pe',
    label: 'P/E',
    options: [
      { value: 'low', label: 'Thấp (< 10)', test: range('pe', 0, 10) },
      { value: 'mid', label: 'Trung bình (10 – 20)', test: range('pe', 10, 20) },
      { value: 'high', label: 'Cao (> 20)', test: range('pe', 20, null) },
    ],
  },
  {
    id: 'pb',
    label: 'P/B',
    options: [
      { value: 'low', label: 'Thấp (< 1,5)', test: range('pb', 0, 1.5) },
      { value: 'mid', label: 'Trung bình (1,5 – 3)', test: range('pb', 1.5, 3) },
      { value: 'high', label: 'Cao (> 3)', test: range('pb', 3, null) },
    ],
  },
  {
    id: 'roe',
    label: 'ROE',
    options: [
      { value: 'high', label: 'Rất cao (> 20%)', test: range('roe', 20, null) },
      { value: 'mid', label: 'Khá (15% – 20%)', test: range('roe', 15, 20) },
      { value: 'low', label: 'Thấp (< 15%)', test: range('roe', null, 15) },
    ],
  },
  {
    id: 'growth',
    label: 'Tăng trưởng doanh thu',
    options: [
      { value: 'high', label: 'Mạnh (> 15%)', test: range('revenueGrowth', 15, null) },
      { value: 'mid', label: 'Vừa (0% – 15%)', test: range('revenueGrowth', 0, 15) },
      { value: 'neg', label: 'Âm (< 0%)', test: range('revenueGrowth', null, 0) },
    ],
  },
  {
    id: 'dividend',
    label: 'Tỷ suất cổ tức',
    options: [
      { value: 'high', label: 'Cao (> 4%)', test: range('dividendYield', 4, null) },
      { value: 'mid', label: 'Trung bình (2% – 4%)', test: range('dividendYield', 2, 4) },
      { value: 'low', label: 'Thấp (< 2%)', test: range('dividendYield', null, 2) },
    ],
  },
  { id: 'perf1W', label: 'Hiệu suất 1 tuần', options: perfOptions('perf1W') },
  { id: 'perf3M', label: 'Hiệu suất 3 tháng', options: perfOptions('perf3M') },
  { id: 'perf1Y', label: 'Hiệu suất 1 năm', options: perfOptions('perf1Y') },
  {
    id: 'foreign',
    label: 'Sở hữu nước ngoài',
    options: [
      { value: 'high', label: 'Cao (> 30%)', test: range('foreignOwnership', 30, null) },
      { value: 'mid', label: 'Trung bình (10% – 30%)', test: range('foreignOwnership', 10, 30) },
      { value: 'low', label: 'Thấp (< 10%)', test: range('foreignOwnership', null, 10) },
    ],
  },
  {
    id: 'beta',
    label: 'Beta',
    options: [
      { value: 'low', label: 'Thấp (< 0,9)', test: range('beta', null, 0.9) },
      { value: 'mid', label: 'Trung bình (0,9 – 1,2)', test: range('beta', 0.9, 1.2) },
      { value: 'high', label: 'Cao (> 1,2)', test: range('beta', 1.2, null) },
    ],
  },
]

export const getDef = (id) => FILTER_DEFS.find((d) => d.id === id)
export const getOption = (f) => getDef(f.id)?.options.find((o) => o.value === f.value)

/** Mẫu có sẵn. */
export const BUILTIN_TEMPLATES = [
  { id: 'b-div', name: 'Cổ tức cao ổn định', filters: [{ id: 'dividend', value: 'high' }, { id: 'beta', value: 'low' }] },
  { id: 'b-bank', name: 'Ngân hàng định giá rẻ', filters: [{ id: 'sector', value: 'banking' }, { id: 'pb', value: 'low' }] },
  { id: 'b-growth', name: 'Tăng trưởng mạnh', filters: [{ id: 'growth', value: 'high' }, { id: 'roe', value: 'high' }] },
  { id: 'b-blue', name: 'Vốn hoá lớn – Beta thấp', filters: [{ id: 'cap', value: 'large' }, { id: 'beta', value: 'low' }] },
]

/* ---- URL <-> state ---- */
export function parseFilters(str) {
  if (!str) return []
  return str
    .split(',')
    .map((p) => {
      const [id, value] = p.split(':')
      return { id, value }
    })
    .filter((f) => getOption(f))
}
export const serializeFilters = (list) => list.map((f) => `${f.id}:${f.value}`).join(',')

export function applyFilters(rows, filters) {
  const tests = filters.map((f) => getOption(f)?.test).filter(Boolean)
  return rows.filter((s) => tests.every((t) => t(s)))
}

export const describeFilters = (filters) => filters.map((f) => `${getDef(f.id)?.label}: ${getOption(f)?.label}`)
