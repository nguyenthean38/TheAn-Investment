/**
 * Bộ sinh dữ liệu thị trường mô phỏng (tất định theo seed).
 * Mô phỏng các quy tắc của thị trường Việt Nam: biên độ trần/sàn theo sàn,
 * bước giá HOSE, phiên sáng/chiều (nghỉ trưa 11:30–13:00), ngày đáo hạn phái sinh…
 */
import { rng, gaussian, pick, between } from '@/lib/random'
import { STOCKS, SECTORS, INDICES } from './seed/stocks'

const memo = new Map()
const cached = (key, fn) => {
  if (!memo.has(key)) memo.set(key, fn())
  return memo.get(key)
}

/* ---------------- Thời gian & phiên giao dịch ---------------- */

import { vnNow, isWeekday, marketSession } from '@/lib/time'
export { vnNow, marketSession }

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

/** Ngày giao dịch gần nhất (hôm nay nếu đã qua 9:00 ngày thường). */
export function lastTradingDay(now = vnNow()) {
  let d = startOfDay(now)
  if (isWeekday(d) && now.getHours() >= 9) return d
  do d = addDays(d, -1)
  while (!isWeekday(d))
  return d
}

/** `count` ngày giao dịch kết thúc ở `end` (bao gồm). */
export function tradingDays(end, count) {
  const out = []
  let d = end
  while (out.length < count) {
    if (isWeekday(d)) out.push(d)
    d = addDays(d, -1)
  }
  return out.reverse()
}

/* ---------------- Quy tắc giá ---------------- */

const BAND = { HOSE: 0.07, HNX: 0.1, UPCOM: 0.15 }

/** Bước giá HOSE: <10k → 10đ; <50k → 50đ; ≥50k → 100đ. HNX/UPCoM: 100đ. */
export function tickSize(price, exchange = 'HOSE') {
  if (exchange !== 'HOSE') return 100
  if (price < 10000) return 10
  if (price < 50000) return 50
  return 100
}
export const roundTick = (p, ex) => {
  const t = tickSize(p, ex)
  return Math.max(t, Math.round(p / t) * t)
}
export function priceBand(ref, exchange = 'HOSE') {
  const b = BAND[exchange] ?? 0.07
  const t = tickSize(ref, exchange)
  return { ceil: Math.floor((ref * (1 + b)) / t) * t, floor: Math.ceil((ref * (1 - b)) / t) * t }
}

/* ---------------- Chuỗi giá ---------------- */

const HISTORY_DAYS = 760 // ~3 năm

/** Chuỗi OHLCV ngày của cổ phiếu, kết thúc tại ngày giao dịch gần nhất. */
export function dailyBars(ticker) {
  const end = lastTradingDay()
  return cached(`bars:${ticker}:${dayKey(end)}`, () => {
    const s = STOCKS.find((x) => x.ticker === ticker)
    const r = rng(`px:${ticker}`)
    const rDay = rng(`day:${ticker}:${dayKey(end)}`)
    const band = BAND[s.exchange]
    const days = tradingDays(end, HISTORY_DAYS)
    // Đi bộ ngẫu nhiên log-return, sau đó co giãn để giá cuối ≈ giá cấu hình (± dao động theo ngày)
    const rets = days.map((_, i) => {
      let x = s.drift + s.vol * gaussian(r)
      if (i === days.length - 1) x = s.vol * 1.3 * gaussian(rDay) // phiên hôm nay đổi theo ngày
      return Math.max(-band * 0.98, Math.min(band * 0.98, x))
    })
    let p = 1
    const raw = rets.map((x) => (p *= Math.exp(x)))
    const scale = s.price / raw[raw.length - 2] // giá tham chiếu hôm nay = giá cấu hình
    let prev = roundTick(raw[0] * scale, s.exchange)
    const baseVol = s.shares * 1e6 * 0.0016
    return days.map((d, i) => {
      const close = i === 0 ? prev : roundTick(raw[i] * scale, s.exchange)
      const ref = i === 0 ? close : prev
      const { ceil, floor } = priceBand(ref, s.exchange)
      const c = Math.min(ceil, Math.max(floor, close))
      const open = roundTick(ref * (1 + between(r, -0.006, 0.006)), s.exchange)
      const hi = Math.min(ceil, roundTick(Math.max(open, c) * (1 + Math.abs(gaussian(r)) * s.vol * 0.35), s.exchange))
      const lo = Math.max(floor, roundTick(Math.min(open, c) * (1 - Math.abs(gaussian(r)) * s.vol * 0.35), s.exchange))
      const move = Math.abs(c / ref - 1)
      const volume = Math.round((baseVol * (0.55 + r() * 0.9) * (1 + move * 30)) / 100) * 100
      prev = c
      return { t: d.getTime(), date: dayKey(d), open, high: hi, low: lo, close: c, ref, ceil, floor, volume }
    })
  })
}

/** Chuỗi điểm chỉ số theo ngày. */
export function indexBars(code) {
  const end = lastTradingDay()
  return cached(`idx:${code}:${dayKey(end)}`, () => {
    const ix = INDICES.find((x) => x.code === code)
    const r = rng(`idx:${code}`)
    const rDay = rng(`idxday:${code}:${dayKey(end)}`)
    const days = tradingDays(end, HISTORY_DAYS)
    let p = 1
    const raw = days.map((_, i) => {
      const x = i === days.length - 1 ? ix.vol * 1.2 * gaussian(rDay) : ix.drift + ix.vol * gaussian(r)
      return (p *= Math.exp(x))
    })
    const scale = ix.value / raw[raw.length - 2]
    return days.map((d, i) => {
      const close = +(raw[i] * scale).toFixed(2)
      const ref = i ? +(raw[i - 1] * scale).toFixed(2) : close
      return { t: d.getTime(), date: dayKey(d), close, ref, volume: Math.round(between(r, 450, 1100) * 1e6 * (code === 'VNINDEX' ? 1 : 0.3)) }
    })
  })
}

/** Điểm VIX-tương đương: "Chỉ số biến động" tính từ độ lệch chuẩn 20 phiên của VN-Index. */
export function volatilitySeries() {
  const bars = indexBars('VNINDEX')
  return bars.map((b, i) => {
    const w = bars.slice(Math.max(1, i - 19), i + 1)
    const rets = w.map((x) => Math.log(x.close / x.ref))
    const mean = rets.reduce((a, c) => a + c, 0) / (rets.length || 1)
    const sd = Math.sqrt(rets.reduce((a, c) => a + (c - mean) ** 2, 0) / (rets.length || 1))
    return { t: b.t, value: +(sd * Math.sqrt(252) * 100).toFixed(2) }
  })
}

/** Dữ liệu trong phiên (5 phút), có nghỉ trưa. */
export function intradayBars(ticker, isIndex = false) {
  const daily = isIndex ? indexBars(ticker) : dailyBars(ticker)
  const last = daily[daily.length - 1]
  const day = new Date(last.t)
  return cached(`intra:${ticker}:${last.date}`, () => {
    const r = rng(`intra:${ticker}:${last.date}`)
    const slots = []
    for (let m = 9 * 60 + 15; m <= 14 * 60 + 45; m += 5) {
      if (m > 11 * 60 + 30 && m < 13 * 60) continue
      slots.push(m)
    }
    const n = slots.length
    const walk = [0]
    for (let i = 1; i < n; i++) walk.push(walk[i - 1] + gaussian(r))
    // Brownian bridge: bắt đầu ở tham chiếu, kết thúc ở giá đóng cửa
    const startV = last.ref
    const endV = last.close
    const amp = Math.abs(endV - startV) * 0.6 + startV * 0.0035
    const series = slots.map((m, i) => {
      const bridge = walk[i] - (walk[n - 1] * i) / (n - 1)
      let v = startV + ((endV - startV) * i) / (n - 1) + (bridge / Math.sqrt(n)) * amp
      if (!isIndex) v = Math.min(last.ceil, Math.max(last.floor, roundTick(v, STOCKS.find((s) => s.ticker === ticker).exchange)))
      const t = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(m / 60), m % 60).getTime()
      return { t, close: isIndex ? +v.toFixed(2) : v, volume: Math.round((last.volume / n) * (0.4 + r() * 1.2 + (i < 4 || i > n - 5 ? 1.2 : 0))) }
    })
    series[n - 1].close = endV
    // Nếu đang trong phiên, cắt tới thời điểm hiện tại
    const now = vnNow()
    const sameDay = dayKey(now) === last.date && marketSession(now).code !== 'closed'
    if (!sameDay) return series
    const cut = now.getHours() * 60 + now.getMinutes()
    const visible = series.filter((_, i) => slots[i] <= cut)
    return visible.length ? visible : series.slice(0, 1)
  })
}

export const RANGES = {
  '1D': { label: '1N', days: 1 },
  '1W': { label: '1T', days: 5 },
  '1M': { label: '1TH', days: 22 },
  '3M': { label: '3TH', days: 66 },
  '6M': { label: '6TH', days: 130 },
  YTD: { label: 'YTD', days: null },
  '1Y': { label: '1N', days: 252 },
  '3Y': { label: '3N', days: HISTORY_DAYS },
}

export function sliceRange(bars, range) {
  if (range === 'YTD') {
    const y = new Date(bars[bars.length - 1].t).getFullYear()
    const idx = bars.findIndex((b) => new Date(b.t).getFullYear() === y)
    return bars.slice(Math.max(0, idx - 1))
  }
  const n = RANGES[range]?.days ?? 252
  return bars.slice(-n - 1)
}

/* ---------------- Cơ bản doanh nghiệp ---------------- */

const SECTOR_PROFILE = {
  banking: { pe: [7, 14], pb: [1.1, 2.4], margin: 0.34, roe: [14, 24], div: [0, 2.5], beta: 1.05 },
  realestate: { pe: [9, 24], pb: [0.9, 2.2], margin: 0.28, roe: [6, 16], div: [0, 1.5], beta: 1.35 },
  tech: { pe: [18, 26], pb: [4, 7], margin: 0.13, roe: [24, 30], div: [1.2, 2.2], beta: 0.95 },
  materials: { pe: [9, 18], pb: [1, 1.8], margin: 0.08, roe: [7, 15], div: [0, 3], beta: 1.3 },
  energy: { pe: [11, 17], pb: [1.6, 2.8], margin: 0.08, roe: [12, 20], div: [3, 6], beta: 0.85 },
  retail: { pe: [15, 26], pb: [2.5, 4.2], margin: 0.035, roe: [14, 22], div: [0.5, 2], beta: 1.15 },
  consumer: { pe: [15, 24], pb: [2.4, 5], margin: 0.15, roe: [18, 28], div: [3, 6], beta: 0.75 },
  securities: { pe: [12, 20], pb: [1.3, 2.2], margin: 0.38, roe: [9, 15], div: [0, 3], beta: 1.55 },
  industrials: { pe: [10, 20], pb: [1.8, 3.2], margin: 0.14, roe: [12, 22], div: [1, 3], beta: 1.05 },
  chemicals: { pe: [12, 18], pb: [2.8, 4], margin: 0.28, roe: [20, 32], div: [2, 4], beta: 1.2 },
  utilities: { pe: [12, 20], pb: [1.2, 2], margin: 0.14, roe: [8, 15], div: [3, 6], beta: 0.7 },
}

export function profileOf(ticker) {
  return STOCKS.find((s) => s.ticker === ticker.toUpperCase())
}

/** Ảnh chụp chỉ số cơ bản + báo giá (dùng cho bảng & bộ lọc). */
export function snapshot(ticker) {
  const s = profileOf(ticker)
  const bars = dailyBars(s.ticker)
  const last = bars[bars.length - 1]
  return cached(`snap:${s.ticker}:${last.date}`, () => {
    const r = rng(`fund:${s.ticker}`)
    const sp = SECTOR_PROFILE[s.sector]
    const pe = +between(r, ...sp.pe).toFixed(1)
    const marketCap = (last.close * s.shares) / 1000 // tỷ đồng (shares: triệu cp)
    const netIncomeTTM = marketCap / pe
    const revenueTTM = netIncomeTTM / (sp.margin * between(r, 0.85, 1.15))
    const bookValue = marketCap / between(r, ...sp.pb)
    const year = bars.slice(-252)
    const closes = (n) => bars[Math.max(0, bars.length - 1 - n)].close
    const avgVolume = Math.round(bars.slice(-20).reduce((a, b) => a + b.volume, 0) / 20)
    const growth = between(r, -0.18, 0.32)
    return {
      ticker: s.ticker,
      name: s.name,
      exchange: s.exchange,
      sector: s.sector,
      sectorName: SECTORS.find((x) => x.id === s.sector).name,
      color: s.color,
      price: last.close,
      ref: last.ref,
      ceil: last.ceil,
      floor: last.floor,
      open: last.open,
      high: last.high,
      low: last.low,
      change: last.close - last.ref,
      changePct: ((last.close - last.ref) / last.ref) * 100,
      volume: last.volume,
      value: last.volume * last.close,
      avgVolume,
      marketCap,
      shares: s.shares,
      pe: +(marketCap / netIncomeTTM).toFixed(1),
      pb: +(marketCap / bookValue).toFixed(2),
      ps: +(marketCap / revenueTTM).toFixed(2),
      eps: Math.round((netIncomeTTM * 1e9) / (s.shares * 1e6)),
      bvps: Math.round((bookValue * 1e9) / (s.shares * 1e6)),
      roe: +between(r, ...sp.roe).toFixed(1),
      roa: +(between(r, ...sp.roe) / (s.sector === 'banking' ? 11 : 2.2)).toFixed(1),
      grossMargin: +((s.sector === 'banking' || s.sector === 'securities' ? 0.62 : sp.margin * 1.9 + 0.04) * 100 * between(r, 0.9, 1.1)).toFixed(1),
      netMargin: +(sp.margin * 100 * between(r, 0.9, 1.1)).toFixed(1),
      dividendYield: +between(r, ...sp.div).toFixed(2),
      beta: +(sp.beta * between(r, 0.8, 1.2)).toFixed(2),
      revenueTTM,
      netIncomeTTM,
      revenueGrowth: +(growth * 100).toFixed(1),
      epsGrowth: +((growth + between(r, -0.12, 0.12)) * 100).toFixed(1),
      foreignOwnership: +between(r, 4, 48).toFixed(1),
      foreignRoom: s.sector === 'banking' ? 30 : 49,
      high52: Math.max(...year.map((b) => b.high)),
      low52: Math.min(...year.map((b) => b.low)),
      perf1W: (last.close / closes(5) - 1) * 100,
      perf1M: (last.close / closes(22) - 1) * 100,
      perf3M: (last.close / closes(66) - 1) * 100,
      perf1Y: (last.close / closes(252) - 1) * 100,
      perfYTD: (last.close / sliceRange(bars, 'YTD')[0].close - 1) * 100,
      evEbitda: +(pe * between(r, 0.55, 0.85)).toFixed(1),
    }
  })
}

export const allSnapshots = () => STOCKS.map((s) => snapshot(s.ticker))

/* ---------------- Báo cáo tài chính ---------------- */

function quarterLabel(y, q) {
  return `Q${q}/${y}`
}

/** 12 quý + 6 năm. Ngân hàng/chứng khoán dùng chung khung đơn giản hoá. */
export function financials(ticker) {
  const s = profileOf(ticker)
  return cached(`fin:${s.ticker}`, () => {
    const snap = snapshot(s.ticker)
    const r = rng(`fin:${s.ticker}`)
    const sp = SECTOR_PROFILE[s.sector]
    const now = vnNow()
    // Quý gần nhất đã công bố (công bố sau ~20 ngày kết thúc quý)
    let y = now.getFullYear()
    let q = Math.floor(now.getMonth() / 3) // quý trước
    if (now.getDate() < 20 && now.getMonth() % 3 === 0) q -= 1
    if (q <= 0) {
      q += 4
      y -= 1
    }
    const quarters = []
    for (let i = 11; i >= 0; i--) {
      let qq = q - i
      let yy = y
      while (qq <= 0) {
        qq += 4
        yy -= 1
      }
      quarters.push({ y: yy, q: qq })
    }
    const qRev0 = snap.revenueTTM / 4 / Math.pow(1 + snap.revenueGrowth / 100, 1.5)
    const rows = quarters.map(({ y: yy, q: qq }, i) => {
      const season = 1 + 0.08 * Math.sin((qq / 4) * Math.PI * 2 + 1) + (qq === 4 ? 0.06 : 0)
      const revenue = qRev0 * Math.pow(1 + snap.revenueGrowth / 100, i / 4) * season * between(r, 0.92, 1.08)
      const grossMargin = (snap.grossMargin / 100) * between(r, 0.93, 1.07)
      const grossProfit = revenue * grossMargin
      const cogs = revenue - grossProfit
      const sga = revenue * between(r, 0.05, 0.11) * (s.sector === 'retail' ? 2.2 : 1)
      const rnd = s.sector === 'tech' ? revenue * between(r, 0.02, 0.035) : 0
      const netTarget = revenue * sp.margin * between(r, 0.8, 1.2)
      const pretax = netTarget / 0.8
      const interestExpense = revenue * between(r, 0.006, 0.03)
      const interestIncome = revenue * between(r, 0.003, 0.015)
      const operatingIncome = pretax + interestExpense - interestIncome
      const tax = pretax - netTarget
      const netIncome = netTarget
      const eps = Math.round((netIncome * 1e9) / (s.shares * 1e6))
      const totalAssets = snap.marketCap * between(r, 0.9, 1.1) * (s.sector === 'banking' ? 6 : 1.1) * (0.8 + i * 0.02)
      const equity = (snap.marketCap / snap.pb) * (0.82 + i * 0.016)
      const debt = totalAssets * between(r, 0.12, 0.32) * (s.sector === 'banking' ? 0.2 : 1)
      const cash = totalAssets * between(r, 0.05, 0.14)
      const receivables = totalAssets * between(r, 0.06, 0.16)
      const inventory = ['retail', 'materials', 'realestate', 'consumer'].includes(s.sector) ? totalAssets * between(r, 0.12, 0.3) : totalAssets * between(r, 0.01, 0.05)
      const ppe = totalAssets * between(r, 0.15, 0.4)
      const cfo = netIncome * between(r, 0.6, 1.6)
      const capex = -revenue * between(r, 0.02, 0.09)
      return {
        period: quarterLabel(yy, qq),
        year: yy,
        quarter: qq,
        revenue, cogs, grossProfit, grossMargin: grossMargin * 100, sga, rnd, operatingIncome, interestExpense, interestIncome,
        pretax, tax, netIncome, netMargin: (netIncome / revenue) * 100, eps,
        cash, receivables, inventory, ppe, totalAssets, liabilities: totalAssets - equity, debt, equity,
        cfo, capex, fcf: cfo + capex, cfi: capex * between(r, 1, 1.6), cff: -netIncome * between(r, 0.1, 0.6), dividendsPaid: -netIncome * (snap.dividendYield > 0 ? between(r, 0.1, 0.5) : 0),
      }
    })
    // Gộp theo năm (năm có đủ 4 quý) + bổ sung năm cũ ngoại suy
    const byYear = {}
    rows.forEach((row) => (byYear[row.year] ??= []).push(row))
    const sumKeys = ['revenue', 'cogs', 'grossProfit', 'sga', 'rnd', 'operatingIncome', 'interestExpense', 'interestIncome', 'pretax', 'tax', 'netIncome', 'eps', 'cfo', 'capex', 'fcf', 'cfi', 'cff', 'dividendsPaid']
    const lastKeys = ['cash', 'receivables', 'inventory', 'ppe', 'totalAssets', 'liabilities', 'debt', 'equity']
    let annual = Object.entries(byYear)
      .filter(([, list]) => list.length === 4)
      .map(([yy, list]) => {
        const o = { period: `${yy}`, year: +yy }
        sumKeys.forEach((k) => (o[k] = list.reduce((a, c) => a + c[k], 0)))
        lastKeys.forEach((k) => (o[k] = list[3][k]))
        o.grossMargin = (o.grossProfit / o.revenue) * 100
        o.netMargin = (o.netIncome / o.revenue) * 100
        return o
      })
    while (annual.length < 6) {
      const first = annual[0]
      const g = 1 + snap.revenueGrowth / 100
      const f = between(r, 0.9, 1.05) / g
      const o = { period: `${first.year - 1}`, year: first.year - 1 }
      sumKeys.forEach((k) => (o[k] = first[k] * f))
      lastKeys.forEach((k) => (o[k] = first[k] * f))
      o.grossMargin = (o.grossProfit / o.revenue) * 100
      o.netMargin = (o.netIncome / o.revenue) * 100
      annual = [o, ...annual]
    }
    return { quarterly: rows, annual: annual.slice(-6) }
  })
}

/* ---------------- KQKD so với dự phóng ---------------- */

export function earnings(ticker) {
  const s = profileOf(ticker)
  return cached(`earn:${s.ticker}`, () => {
    const r = rng(`earn:${s.ticker}`)
    const { quarterly } = financials(s.ticker)
    const bars = dailyBars(s.ticker)
    const history = quarterly.slice(-8).map((row) => {
      const estEps = Math.round(row.eps * between(r, 0.88, 1.1))
      const estRevenue = row.revenue * between(r, 0.94, 1.05)
      const reportDate = new Date(row.year, row.quarter * 3, 18 + Math.floor(r() * 10))
      const idx = bars.findIndex((b) => b.t >= reportDate.getTime())
      const reaction = idx > 0 ? ((bars[idx].close - bars[idx].ref) / bars[idx].ref) * 100 : null
      return {
        period: row.period, reportDate: reportDate.getTime(), estEps, actualEps: row.eps,
        epsSurprise: ((row.eps - estEps) / Math.abs(estEps || 1)) * 100,
        estRevenue, actualRevenue: row.revenue, revenueSurprise: ((row.revenue - estRevenue) / estRevenue) * 100,
        beat: row.eps >= estEps, reaction,
      }
    })
    const lastQ = quarterly[quarterly.length - 1]
    let nq = lastQ.quarter + 1
    let ny = lastQ.year
    if (nq > 4) {
      nq = 1
      ny += 1
    }
    const next = {
      period: quarterLabel(ny, nq),
      reportDate: new Date(ny, nq * 3, 20 + Math.floor(r() * 8)).getTime(),
      estEps: Math.round(lastQ.eps * between(r, 0.95, 1.15)),
      estRevenue: lastQ.revenue * between(r, 0.98, 1.12),
    }
    return { history, next }
  })
}

/* ---------------- Khuyến nghị CTCK ---------------- */

const RESEARCH_HOUSES = ['Nhịp Research', 'Phương Nam Securities', 'Sao Bắc Capital', 'Đông Á Research', 'Hồng Hà Securities', 'Trường Sơn Invest', 'Mekong Equity', 'Lạc Hồng Research', 'Bạch Đằng Securities', 'Tây Hồ Capital']
export const RATING_SCALE = [
  { id: 'strong_buy', label: 'Mua mạnh' },
  { id: 'buy', label: 'Mua' },
  { id: 'hold', label: 'Trung lập' },
  { id: 'sell', label: 'Kém khả quan' },
  { id: 'strong_sell', label: 'Bán' },
]

export function analysts(ticker) {
  const s = profileOf(ticker)
  return cached(`an:${s.ticker}`, () => {
    const r = rng(`an:${s.ticker}`)
    const price = snapshot(s.ticker).price
    const bias = between(r, -0.05, 0.25)
    const counts = { strong_buy: 0, buy: 0, hold: 0, sell: 0, strong_sell: 0 }
    const now = vnNow().getTime()
    const actions = RESEARCH_HOUSES.slice(0, 6 + Math.floor(r() * 4)).map((house, i) => {
      const upside = bias + gaussian(r) * 0.12
      const rating = upside > 0.2 ? 'strong_buy' : upside > 0.08 ? 'buy' : upside > -0.05 ? 'hold' : upside > -0.15 ? 'sell' : 'strong_sell'
      counts[rating] += 1
      const target = roundTick(price * (1 + upside), s.exchange)
      const prevTarget = roundTick(target * between(r, 0.85, 1.08), s.exchange)
      const prevRating = r() < 0.7 ? rating : pick(r, RATING_SCALE).id
      const ri = RATING_SCALE.findIndex((x) => x.id === rating)
      const pi = RATING_SCALE.findIndex((x) => x.id === prevRating)
      return {
        id: `${s.ticker}-${i}`,
        house,
        rating,
        prevRating,
        action: i === 0 && r() < 0.3 ? 'init' : ri < pi ? 'upgrade' : ri > pi ? 'downgrade' : 'reiterate',
        target,
        prevTarget,
        date: now - Math.floor(between(r, 2, 160)) * 86400000,
      }
    }).sort((a, b) => b.date - a.date)
    const targets = actions.map((a) => a.target).sort((a, b) => a - b)
    const median = targets[Math.floor(targets.length / 2)]
    const total = actions.length
    const score = (counts.strong_buy * 2 + counts.buy - counts.sell - counts.strong_sell * 2) / total
    return {
      counts,
      total,
      consensus: score > 0.9 ? 'Mua mạnh' : score > 0.3 ? 'Khả quan' : score > -0.3 ? 'Trung lập' : 'Thận trọng',
      target: { low: targets[0], median, high: targets[targets.length - 1], upside: ((median - price) / price) * 100 },
      actions,
    }
  })
}

/* ---------------- Giao dịch nội bộ / cổ đông lớn ---------------- */

const FIRST = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô']
const MID = ['Văn', 'Thị', 'Minh', 'Đức', 'Thanh', 'Quốc', 'Hữu', 'Ngọc']
const LAST = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Khánh', 'Lâm', 'Long', 'Mai', 'Nam', 'Phúc', 'Quân', 'Sơn', 'Trang', 'Vy']
const ROLES = ['Chủ tịch HĐQT', 'Thành viên HĐQT', 'Tổng giám đốc', 'Phó Tổng giám đốc', 'Kế toán trưởng', 'Người có liên quan', 'Cổ đông lớn', 'Trưởng Ban kiểm soát']

export function insiders(ticker) {
  const s = profileOf(ticker)
  return cached(`ins:${s.ticker}`, () => {
    const r = rng(`ins:${s.ticker}`)
    const bars = dailyBars(s.ticker)
    const list = Array.from({ length: 6 + Math.floor(r() * 8) }, (_, i) => {
      const daysAgo = Math.floor(between(r, 1, 360))
      const bar = bars[Math.max(0, bars.length - 1 - Math.floor(daysAgo * 0.7))]
      const type = r() < 0.55 ? 'sell' : 'buy'
      const qty = Math.round(between(r, 0.05, 3) * 1e5 * (s.shares / 1000)) * 10
      const done = r() < 0.8 ? qty : Math.round(qty * between(r, 0.2, 0.9))
      return {
        id: `${s.ticker}-ins-${i}`,
        ticker: s.ticker,
        name: `${pick(r, FIRST)} ${pick(r, MID)} ${pick(r, LAST)}`,
        role: pick(r, ROLES),
        type,
        registered: qty,
        executed: done,
        price: bar.close,
        value: done * bar.close,
        date: bar.t,
        ownedAfter: Math.round(between(r, 0.1, 8) * 1e6),
      }
    }).sort((a, b) => b.date - a.date)
    return list
  })
}

/* ---------------- Khối ngoại ---------------- */

export function foreignFlow(ticker) {
  const s = profileOf(ticker)
  const bars = dailyBars(s.ticker).slice(-30)
  return cached(`ff:${s.ticker}:${bars[bars.length - 1].date}`, () => {
    const r = rng(`ff:${s.ticker}`)
    const bias = between(r, -0.3, 0.3)
    return bars.map((b) => {
      const v = b.volume * b.close
      const buy = v * between(r, 0.04, 0.18)
      const sell = buy * Math.max(0.2, 1 - bias + gaussian(r) * 0.4)
      return { t: b.t, buy, sell, net: buy - sell }
    })
  })
}

/* ---------------- Tin tức ---------------- */

const SOURCES = ['Nhịp Tin', 'Thời báo Thị trường', 'Kinh tế Số', 'Bản tin Doanh nghiệp', 'Tài chính 24h']
const TEMPLATES = [
  ['positive', (s) => `${s.ticker} báo lãi quý vượt kỳ vọng, biên lợi nhuận gộp cải thiện rõ rệt`],
  ['positive', (s) => `${s.name} được nâng mục tiêu giá nhờ triển vọng tăng trưởng ${pick(rng(s.ticker), ['xuất khẩu', 'bán lẻ', 'tín dụng', 'dự án mới'])}`],
  ['positive', (s) => `Khối ngoại quay lại mua ròng ${s.ticker} phiên thứ ba liên tiếp`],
  ['neutral', (s) => `${s.ticker} chốt danh sách cổ đông họp Đại hội đồng cổ đông thường niên`],
  ['neutral', (s) => `${s.ticker} công bố kế hoạch kinh doanh năm, đặt mục tiêu doanh thu tăng hai chữ số`],
  ['negative', (s) => `Lãnh đạo ${s.ticker} đăng ký bán bớt cổ phiếu trong bối cảnh giá đi ngang`],
  ['negative', (s) => `${s.ticker} chịu áp lực chi phí đầu vào, lợi nhuận quý giảm so với cùng kỳ`],
  ['positive', (s) => `${s.ticker} chuẩn bị chia cổ tức tiền mặt, tỷ suất khoảng ${(2 + (s.price % 4)).toFixed(0)}%`],
  ['neutral', (s) => `Chuyên gia: ${s.ticker} đang giao dịch quanh vùng định giá hợp lý của ngành`],
]
const MACRO_NEWS = [
  ['neutral', 'Ngân hàng Nhà nước giữ nguyên lãi suất điều hành, ưu tiên ổn định tỷ giá'],
  ['positive', 'Tổng cục Thống kê: CPI tháng tăng nhẹ, lạm phát vẫn trong tầm kiểm soát'],
  ['positive', 'Thanh khoản thị trường cải thiện, giá trị khớp lệnh HOSE vượt 20 nghìn tỷ đồng'],
  ['negative', 'Tỷ giá USD/VND tăng nhẹ, khối ngoại tiếp tục bán ròng trên HOSE'],
  ['positive', 'Xuất khẩu tháng tăng hai chữ số, thặng dư thương mại được duy trì'],
  ['neutral', 'Fed phát tín hiệu thận trọng, thị trường châu Á biến động trái chiều'],
]

export function news({ ticker, limit = 20 } = {}) {
  const now = vnNow()
  return cached(`news:${ticker ?? 'all'}:${dayKey(now)}:${now.getHours()}`, () => {
    const r = rng(`news:${ticker ?? 'all'}:${dayKey(now)}`)
    const pool = ticker ? [profileOf(ticker)] : STOCKS
    const items = []
    for (let i = 0; i < limit; i++) {
      const minutesAgo = Math.floor(Math.pow(r(), 1.6) * 60 * 24 * (ticker ? 30 : 3)) + 3
      if (!ticker && i % 5 === 4) {
        const [sentiment, title] = pick(r, MACRO_NEWS)
        items.push({ id: `macro-${i}`, tickers: [], title, sentiment, source: pick(r, SOURCES), publishedAt: now.getTime() - minutesAgo * 60000 })
        continue
      }
      const s = pick(r, pool)
      const [sentiment, tpl] = pick(r, TEMPLATES)
      items.push({ id: `${s.ticker}-${i}`, tickers: [s.ticker], title: tpl(s), sentiment, source: pick(r, SOURCES), publishedAt: now.getTime() - minutesAgo * 60000 })
    }
    const seen = new Set()
    return items
      .filter((n) => !seen.has(n.title) && seen.add(n.title))
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .map((n) => ({
        ...n,
        summary: `${n.title}. Theo ${n.source}, thông tin này ${n.sentiment === 'positive' ? 'được nhà đầu tư đón nhận tích cực' : n.sentiment === 'negative' ? 'tạo áp lực tâm lý ngắn hạn' : 'chưa tác động đáng kể tới giá'}; nhà đầu tư nên theo dõi thêm diễn biến dòng tiền và kết quả kinh doanh các quý tới.`,
        sourceCount: 1 + Math.floor(r() * 5),
      }))
  })
}

/* ---------------- Tổng quan thị trường ---------------- */

export function indexQuote(code) {
  const ix = INDICES.find((x) => x.code === code)
  const bars = indexBars(code)
  const last = bars[bars.length - 1]
  return { code, name: ix.name, value: last.close, ref: last.ref, change: last.close - last.ref, changePct: ((last.close - last.ref) / last.ref) * 100, volume: last.volume }
}

export function sectorPerformance() {
  const snaps = allSnapshots()
  return SECTORS.map((sec) => {
    const list = snaps.filter((s) => s.sector === sec.id)
    const cap = list.reduce((a, s) => a + s.marketCap, 0)
    const changePct = list.reduce((a, s) => a + s.changePct * s.marketCap, 0) / cap
    const perf1M = list.reduce((a, s) => a + s.perf1M * s.marketCap, 0) / cap
    return { id: sec.id, name: sec.name, changePct, perf1M, marketCap: cap, tickers: list.map((s) => s.ticker) }
  }).sort((a, b) => b.changePct - a.changePct)
}

export function breadth() {
  const snaps = allSnapshots()
  const r = rng(`breadth:${dayKey(lastTradingDay())}`)
  // Nhân rộng ra toàn sàn (~400 mã HOSE)
  const k = 400 / snaps.length
  const up = Math.round(snaps.filter((s) => s.change > 0).length * k * between(r, 0.9, 1.1))
  const down = Math.round(snaps.filter((s) => s.change < 0).length * k * between(r, 0.9, 1.1))
  const flat = Math.max(20, 400 - up - down)
  return { up, down, flat, ceil: Math.round(between(r, 2, 14)), floor: Math.round(between(r, 0, 9)) }
}

export function marketMood() {
  const vn = indexQuote('VNINDEX')
  const b = breadth()
  const ratio = b.up / Math.max(1, b.down)
  if (vn.changePct > 0.8 && ratio > 1.4) return { id: 'bullish', label: 'hưng phấn' }
  if (vn.changePct > 0.15) return { id: 'positive', label: 'tích cực' }
  if (vn.changePct < -0.8 && ratio < 0.7) return { id: 'bearish', label: 'tiêu cực' }
  if (vn.changePct < -0.15) return { id: 'cautious', label: 'thận trọng' }
  return { id: 'neutral', label: 'giằng co' }
}

export function foreignMarket() {
  const snaps = allSnapshots()
  const rows = snaps.map((s) => {
    const ff = foreignFlow(s.ticker)
    const last = ff[ff.length - 1]
    return { ticker: s.ticker, name: s.name, color: s.color, net: last.net, buy: last.buy, sell: last.sell, changePct: s.changePct }
  })
  const net = rows.reduce((a, x) => a + x.net, 0)
  const series = foreignFlow(STOCKS[0].ticker).map((d, i) => ({
    t: d.t,
    net: STOCKS.reduce((a, s) => a + foreignFlow(s.ticker)[i].net, 0),
  }))
  return {
    net,
    topBuy: [...rows].sort((a, b) => b.net - a.net).slice(0, 5),
    topSell: [...rows].sort((a, b) => a.net - b.net).slice(0, 5),
    series,
  }
}

export function globalMarkets() {
  const r = rng(`global:${dayKey(lastTradingDay())}`)
  const mk = (code, name, region, value, vol = 0.9) => {
    const changePct = gaussian(r) * vol
    const ytd = gaussian(r) * 9 + 4
    return { code, name, region, value, changePct, change: (value * changePct) / 100, ytd, spark: Array.from({ length: 30 }, (_, i) => value * (1 + (Math.sin(i / 3 + r() * 2) * vol) / 60 + (i * ytd) / 3000)) }
  }
  return {
    indices: [
      mk('SPX', 'S&P 500', 'Mỹ', 5712.4),
      mk('NDX', 'Nasdaq 100', 'Mỹ', 20214.8, 1.2),
      mk('DJI', 'Dow Jones', 'Mỹ', 42308.1, 0.7),
      mk('N225', 'Nikkei 225', 'Nhật Bản', 38410.2, 1.1),
      mk('HSI', 'Hang Seng', 'Hồng Kông', 20876.5, 1.4),
      mk('SSEC', 'Shanghai Composite', 'Trung Quốc', 3318.7, 0.9),
      mk('KOSPI', 'KOSPI', 'Hàn Quốc', 2593.3, 1),
      mk('SET', 'SET Index', 'Thái Lan', 1421.6, 0.7),
      mk('DAX', 'DAX', 'Đức', 19254.9, 0.8),
      mk('UKX', 'FTSE 100', 'Anh', 8266.2, 0.6),
    ],
    commodities: [
      mk('XAU', 'Vàng (USD/oz)', 'Hàng hoá', 2654.3, 0.8),
      mk('BRENT', 'Dầu Brent (USD/thùng)', 'Hàng hoá', 74.6, 1.6),
      mk('USDVND', 'USD/VND', 'Tỷ giá', 25385, 0.15),
      mk('DXY', 'Chỉ số USD (DXY)', 'Tỷ giá', 104.2, 0.3),
      mk('STEEL', 'Thép HRC (USD/tấn)', 'Hàng hoá', 548, 1.2),
    ],
  }
}

/* ---------------- Vĩ mô ---------------- */

export function macro() {
  const now = vnNow()
  return cached(`macro:${dayKey(now)}`, () => {
    const r = rng(`macro:${now.getFullYear()}-${now.getMonth()}`)
    const yieldCurve = [
      ['1N', 1.9], ['2N', 2.0], ['3N', 2.1], ['5N', 2.35], ['7N', 2.55], ['10N', 2.85], ['15N', 3.0], ['20N', 3.15], ['30N', 3.3],
    ].map(([tenor, y]) => ({ tenor, value: +(y + gaussian(r) * 0.04).toFixed(2), prev: +(y + gaussian(r) * 0.08 - 0.05).toFixed(2) }))
    const base = startOfDay(now)
    const ev = (offset, hour, title, country, impact, extra = {}) => {
      const d = addDays(base, offset)
      d.setHours(hour, extra.minute ?? 0)
      return { id: `${title}-${offset}`, date: d.getTime(), title, country, impact, ...extra }
    }
    const events = [
      ev(-9, 9, 'Chỉ số PMI sản xuất', 'VN', 2, { prev: '49,8', forecast: '50,2', actual: '50,6', unit: '' }),
      ev(-6, 9, 'Chỉ số giá tiêu dùng (CPI) so với cùng kỳ', 'VN', 3, { prev: '2,89%', forecast: '3,00%', actual: '3,02%' }),
      ev(-6, 9, 'Sản xuất công nghiệp (IIP)', 'VN', 2, { prev: '8,1%', forecast: '8,5%', actual: '8,9%' }),
      ev(-6, 10, 'Kim ngạch xuất khẩu tháng', 'VN', 2, { prev: '+10,2%', forecast: '+11,0%', actual: '+12,4%' }),
      ev(-4, 20, 'Báo cáo việc làm phi nông nghiệp', 'US', 3, { prev: '227K', forecast: '200K', actual: '256K', minute: 30 }),
      ev(-2, 9, 'Chỉ số giá sản xuất (PPI)', 'CN', 1, { prev: '-2,5%', forecast: '-2,3%', actual: '-2,3%', minute: 30 }),
      ev(-1, 15, 'Đáo hạn hợp đồng tương lai VN30', 'VN', 2, { prev: null, forecast: null, actual: null, kind: 'event' }),
      ev(0, 9, 'Họp báo Chính phủ thường kỳ', 'VN', 1, { kind: 'speech' }),
      ev(0, 20, 'Chỉ số giá tiêu dùng Mỹ (CPI)', 'US', 3, { prev: '2,7%', forecast: '2,8%', actual: null, minute: 30 }),
      ev(1, 14, 'Phát biểu của Thống đốc NHNN', 'VN', 2, { kind: 'speech' }),
      ev(2, 2, 'Quyết định lãi suất của Fed', 'US', 3, { prev: '4,50%', forecast: '4,25%', actual: null }),
      ev(3, 9, 'Đấu giá trái phiếu Chính phủ', 'VN', 1, { prev: '2,85%', forecast: null, actual: null }),
      ev(5, 17, 'FTSE công bố kết quả rà soát danh mục ETF', 'VN', 3, { kind: 'event' }),
      ev(8, 9, 'Tăng trưởng GDP quý so với cùng kỳ', 'VN', 3, { prev: '7,4%', forecast: '7,1%', actual: null }),
      ev(10, 9, 'Doanh số bán lẻ hàng hoá & dịch vụ', 'VN', 2, { prev: '+9,0%', forecast: '+9,2%', actual: null }),
      ev(12, 8, 'Chỉ số PMI Caixin', 'CN', 2, { prev: '50,3', forecast: '50,5', actual: null, minute: 45 }),
    ]
    const rates = [
      { label: 'Lãi suất tái cấp vốn', value: '4,50%' },
      { label: 'Lãi suất tiền gửi 12 tháng (BQ)', value: '4,80%' },
      { label: 'Lãi suất liên ngân hàng qua đêm', value: `${(3.6 + gaussian(r) * 0.4).toFixed(2).replace('.', ',')}%` },
      { label: 'Tỷ giá trung tâm USD/VND', value: '24.312' },
      { label: 'CPI bình quân từ đầu năm', value: '3,27%' },
      { label: 'Tăng trưởng tín dụng YTD', value: '12,5%' },
    ]
    return {
      outlook: { id: 'optimistic', label: 'Triển vọng vĩ mô tích cực', summary: 'Lạm phát trong tầm kiểm soát, xuất khẩu duy trì đà tăng hai chữ số và mặt bằng lãi suất thấp tiếp tục hỗ trợ tăng trưởng tín dụng. Rủi ro chính đến từ áp lực tỷ giá khi đồng USD mạnh lên và diễn biến chính sách của Fed.' },
      yieldCurve,
      rates,
      events: events.sort((a, b) => a.date - b.date),
    }
  })
}

/* ---------------- Lịch sự kiện doanh nghiệp ---------------- */

export function corporateEvents() {
  const now = vnNow()
  return cached(`cev:${dayKey(now)}`, () => {
    const base = startOfDay(now)
    const out = []
    STOCKS.forEach((s) => {
      const r = rng(`cev:${s.ticker}:${base.getMonth()}`)
      const e = earnings(s.ticker)
      // KQKD sắp tới & vừa qua
      const pushEarn = (date, period, done, extra) => out.push({ id: `${s.ticker}-earn-${period}`, ticker: s.ticker, name: s.name, color: s.color, type: 'earnings', title: `Công bố KQKD ${period}`, date, session: r() < 0.5 ? 'pre' : 'post', done, ...extra })
      const lastE = e.history[e.history.length - 1]
      pushEarn(lastE.reportDate, lastE.period, true, { estEps: lastE.estEps, actualEps: lastE.actualEps, beat: lastE.beat, estRevenue: lastE.estRevenue, actualRevenue: lastE.actualRevenue })
      pushEarn(e.next.reportDate, e.next.period, false, { estEps: e.next.estEps, estRevenue: e.next.estRevenue })
      // Sự kiện ngẫu nhiên trong cửa sổ -40..+60 ngày
      const n = 1 + Math.floor(r() * 3)
      for (let i = 0; i < n; i++) {
        const offset = Math.floor(between(r, -40, 60))
        let d = addDays(base, offset)
        while (!isWeekday(d)) d = addDays(d, 1)
        const kind = pick(r, ['dividend', 'dividend', 'agm', 'listing', 'meeting'])
        const map = {
          dividend: `Ngày GDKHQ cổ tức tiền mặt ${formatVnd(Math.round(between(r, 5, 30)) * 100)}/cp`,
          agm: 'Đại hội đồng cổ đông thường niên',
          listing: 'Niêm yết bổ sung cổ phiếu phát hành',
          meeting: 'Gặp gỡ nhà đầu tư (Investor Day)',
        }
        out.push({ id: `${s.ticker}-${kind}-${i}`, ticker: s.ticker, name: s.name, color: s.color, type: kind, title: map[kind], date: d.getTime() + 9 * 3600000, session: 'pre', done: d < base })
      }
    })
    // Sự kiện thị trường
    for (let m = -1; m <= 2; m++) {
      const first = new Date(base.getFullYear(), base.getMonth() + m, 1)
      let thursdays = 0
      let d = first
      while (thursdays < 3) {
        if (d.getDay() === 4) thursdays++
        if (thursdays < 3) d = addDays(d, 1)
      }
      out.push({ id: `deriv-${dayKey(d)}`, ticker: null, name: 'Thị trường phái sinh', type: 'market', title: 'Đáo hạn hợp đồng tương lai VN30', date: d.getTime() + 14 * 3600000, session: 'post', done: d < base })
    }
    return out.sort((a, b) => a.date - b.date)
  })
}

function formatVnd(v) {
  return new Intl.NumberFormat('vi-VN').format(v) + 'đ'
}

/** Giao dịch nội bộ toàn thị trường (trang Phân tích). */
export function marketInsiders() {
  return STOCKS.flatMap((s) => insiders(s.ticker).map((x) => ({ ...x, company: s.name, color: s.color }))).sort((a, b) => b.date - a.date)
}

/** Danh sách cùng ngành (đồng nghiệp) — mặc định cùng sector, bổ sung theo vốn hoá gần nhất. */
export function peersOf(ticker) {
  const s = profileOf(ticker)
  const same = STOCKS.filter((x) => x.sector === s.sector && x.ticker !== s.ticker).map((x) => x.ticker)
  if (same.length >= 3) return same.slice(0, 6)
  const cap = snapshot(s.ticker).marketCap
  const others = allSnapshots()
    .filter((x) => x.ticker !== s.ticker && !same.includes(x.ticker))
    .sort((a, b) => Math.abs(a.marketCap - cap) - Math.abs(b.marketCap - cap))
    .slice(0, 4 - same.length)
    .map((x) => x.ticker)
  return [...same, ...others]
}
