/**
 * Mock API chạy trong trình duyệt — hiện thực docs/API_CONTRACT.md.
 * Dữ liệu thị trường: sinh tất định (market.js). Dữ liệu người dùng: localStorage.
 */
import { env } from '@/config/env'
import { storage, uid } from '@/utils/storage'
import { STOCKS, SECTORS, INDICES } from './seed/stocks'
import * as M from './market'

const DB_KEY = 'nhip.db.v1'
const DEMO_EMAIL = 'demo@nhip.vn'

function defaultWatchlists() {
  return [
    { id: uid('wl_'), name: 'Cổ phiếu theo dõi', tickers: ['FPT', 'VCB', 'HPG', 'MWG', 'VNM'], createdAt: Date.now() },
    { id: uid('wl_'), name: 'Ngân hàng', tickers: ['TCB', 'MBB', 'ACB'], createdAt: Date.now() },
  ]
}

function newUser(email, name) {
  return {
    id: uid('u_'),
    email,
    name: name?.trim() || (([n]) => n.charAt(0).toUpperCase() + n.slice(1))(email.split('@')[0].split(/[._-]/)),
    createdAt: Date.now(),
    onboarded: false,
    interests: [],
    preferences: { hideHints: false, hideDock: false, newsletter: true, priceUnit: 'dong', reduceMotion: false },
  }
}

function seedDb() {
  const demo = { ...newUser(DEMO_EMAIL, 'Minh Anh'), onboarded: true, interests: ['tech', 'banking'] }
  return {
    users: { [DEMO_EMAIL]: demo },
    sessions: {},
    watchlists: { [DEMO_EMAIL]: defaultWatchlists() },
    holdings: {
      [DEMO_EMAIL]: [
        { id: uid('h_'), ticker: 'FPT', quantity: 800, avgPrice: 104500, createdAt: Date.now() },
        { id: uid('h_'), ticker: 'HPG', quantity: 3000, avgPrice: 27900, createdAt: Date.now() },
        { id: uid('h_'), ticker: 'MWG', quantity: 1000, avgPrice: 52300, createdAt: Date.now() },
        { id: uid('h_'), ticker: 'VCB', quantity: 500, avgPrice: 88400, createdAt: Date.now() },
      ],
    },
    templates: {},
    subscriptions: { [DEMO_EMAIL]: { plan: 'monthly', status: 'active', since: Date.now() - 86400000 * 120, renewsAt: Date.now() + 86400000 * 12 } },
    referrals: { [DEMO_EMAIL]: [] },
    feedback: [],
  }
}

const db = {
  read() {
    return storage.get(DB_KEY) ?? seedDb()
  },
  write(data) {
    storage.set(DB_KEY, data)
  },
  tx(fn) {
    const data = this.read()
    const out = fn(data)
    this.write(data)
    return out
  },
}

/* ---------------- Tiện ích phản hồi ---------------- */

class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}
const ok = (data, meta) => ({ status: 200, body: meta ? { data, meta } : { data } })
const created = (data) => ({ status: 201, body: { data } })
const noContent = () => ({ status: 204, body: null })
const notFound = (msg = 'Không tìm thấy dữ liệu.') => {
  throw new HttpError(404, 'NOT_FOUND', msg)
}

function requireUser(headers) {
  const token = headers.Authorization?.replace('Bearer ', '')
  const data = db.read()
  const email = token && data.sessions[token]
  if (!email || !data.users[email]) throw new HttpError(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  return email
}

function stockOr404(t) {
  const s = M.profileOf(t)
  if (!s) notFound(`Không tìm thấy mã cổ phiếu "${t.toUpperCase()}".`)
  return s
}

const validEmail = (e) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())

/* ---------------- Định tuyến ---------------- */

const routes = []
const on = (method, pattern, handler) => {
  const keys = []
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$')
  routes.push({ method, re, keys, handler })
}

/* ===== Auth (magic link) ===== */
on('POST', '/auth/magic-link', ({ body }) => {
  if (!validEmail(body?.email)) throw new HttpError(422, 'VALIDATION', 'Email không hợp lệ.', { email: 'Vui lòng nhập email hợp lệ.' })
  return ok({ sent: true, email: body.email.trim().toLowerCase() })
})
on('POST', '/auth/verify', ({ body }) => {
  const email = body?.email?.trim().toLowerCase()
  if (!validEmail(email)) throw new HttpError(422, 'VALIDATION', 'Liên kết không hợp lệ hoặc đã hết hạn.')
  return db.tx((d) => {
    const isNew = !d.users[email]
    if (isNew) {
      d.users[email] = newUser(email, body.name)
      d.watchlists[email] = [{ id: uid('wl_'), name: 'Cổ phiếu theo dõi', tickers: [], createdAt: Date.now() }]
      d.holdings[email] = []
      d.referrals[email] = []
      d.subscriptions[email] = { plan: 'trial', status: 'trialing', since: Date.now(), renewsAt: Date.now() + 86400000 * 14 }
    }
    const token = uid('tk_') + uid()
    d.sessions[token] = email
    return ok({ token, user: d.users[email], isNew })
  })
})
on('POST', '/auth/demo', () =>
  db.tx((d) => {
    if (!d.users[DEMO_EMAIL]) Object.assign(d, seedDb(), { sessions: d.sessions })
    const token = uid('tk_') + uid()
    d.sessions[token] = DEMO_EMAIL
    return ok({ token, user: d.users[DEMO_EMAIL], isNew: false })
  }),
)
on('POST', '/auth/logout', ({ headers }) =>
  db.tx((d) => {
    const token = headers.Authorization?.replace('Bearer ', '')
    if (token) delete d.sessions[token]
    return noContent()
  }),
)

/* ===== Tài khoản ===== */
on('GET', '/me', ({ headers }) => ok(db.read().users[requireUser(headers)]))
on('PATCH', '/me', ({ headers, body }) => {
  const email = requireUser(headers)
  if (body?.name != null && !String(body.name).trim()) throw new HttpError(422, 'VALIDATION', 'Tên không được để trống.', { name: 'Vui lòng nhập tên.' })
  return db.tx((d) => {
    const u = d.users[email]
    if (body.name != null) u.name = String(body.name).trim().slice(0, 60)
    if (body.onboarded != null) u.onboarded = !!body.onboarded
    if (Array.isArray(body.interests)) u.interests = body.interests.filter((x) => SECTORS.some((s) => s.id === x))
    if (body.preferences) u.preferences = { ...u.preferences, ...body.preferences }
    return ok(u)
  })
})

/* ===== Thị trường ===== */
on('GET', '/market/overview', () => {
  const session = M.marketSession()
  return ok({
    session,
    tradingDay: M.lastTradingDay().getTime(),
    indices: INDICES.map((i) => M.indexQuote(i.code)),
    breadth: M.breadth(),
    mood: M.marketMood(),
    liquidity: M.allSnapshots().reduce((a, s) => a + s.value, 0) * 9.5,
  })
})
on('GET', '/market/indices/:code/history', ({ params, query }) => {
  const code = params.code.toUpperCase()
  if (!INDICES.some((i) => i.code === code)) notFound('Không tìm thấy chỉ số.')
  const range = query.range ?? '1Y'
  if (range === '1D') return ok(M.intradayBars(code, true).map((b) => ({ t: b.t, value: b.close, volume: b.volume })))
  const bars = M.sliceRange(M.indexBars(code), range)
  const vol = M.volatilitySeries()
  const volMap = new Map(vol.map((v) => [v.t, v.value]))
  return ok(bars.map((b) => ({ t: b.t, value: b.close, volume: b.volume, volatility: volMap.get(b.t) })))
})
on('GET', '/market/sectors', () => ok(M.sectorPerformance()))
on('GET', '/market/movers', () => {
  const s = M.allSnapshots()
  return ok({
    gainers: [...s].sort((a, b) => b.changePct - a.changePct).slice(0, 6),
    losers: [...s].sort((a, b) => a.changePct - b.changePct).slice(0, 6),
    active: [...s].sort((a, b) => b.value - a.value).slice(0, 6),
  })
})
on('GET', '/market/foreign', () => ok(M.foreignMarket()))
on('GET', '/market/global', () => ok(M.globalMarkets()))
on('GET', '/market/macro', () => ok(M.macro()))
on('GET', '/market/insiders', ({ query }) => {
  const list = M.marketInsiders()
  const type = query.type
  return ok((type ? list.filter((x) => x.type === type) : list).slice(0, Number(query.limit ?? 30)))
})
on('GET', '/market/recap', () => {
  const vn = M.indexQuote('VNINDEX')
  const sectors = M.sectorPerformance()
  const ff = M.foreignMarket()
  const b = M.breadth()
  const up = vn.change >= 0
  const pts = Math.abs(vn.change).toFixed(2).replace('.', ',')
  const lead = sectors[0]
  const lag = sectors[sectors.length - 1]
  const buy = ff.topBuy[0]
  const sell = ff.topSell[0]
  const text =
    `VN-Index ${up ? 'tăng' : 'giảm'} ${pts} điểm với ${b.up} mã tăng và ${b.down} mã giảm. ` +
    `Nhóm ${lead.name.toLowerCase()} dẫn dắt thị trường, trong khi ${lag.name.toLowerCase()} chịu áp lực điều chỉnh. ` +
    `Khối ngoại ${ff.net >= 0 ? 'mua ròng' : 'bán ròng'} khoảng ${Math.abs(ff.net / 1e9).toFixed(0)} tỷ đồng, tập trung ${ff.net >= 0 ? 'gom' : 'xả'} ${ff.net >= 0 ? buy.ticker : sell.ticker}.`
  const s = M.marketSession()
  const now = M.vnNow()
  const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), s.code === 'closed' || now.getHours() >= 15 ? 15 : 8, s.code === 'closed' || now.getHours() >= 15 ? 15 : 30)
  return ok({
    headline: text,
    generatedAt: at.getTime(),
    highlights: [
      { label: 'Ngành mạnh nhất', value: lead.name, changePct: lead.changePct },
      { label: 'Ngành yếu nhất', value: lag.name, changePct: lag.changePct },
      { label: 'Khối ngoại', value: ff.net >= 0 ? 'Mua ròng' : 'Bán ròng', amount: ff.net },
    ],
    sections: [
      { title: 'Diễn biến chỉ số', body: `VN-Index đóng cửa tại ${vn.value.toFixed(2).replace('.', ',')} điểm (${up ? '+' : ''}${vn.changePct.toFixed(2).replace('.', ',')}%). Độ rộng thị trường ${b.up > b.down ? 'nghiêng về bên mua' : 'nghiêng về bên bán'}, có ${b.ceil} mã tăng trần và ${b.floor} mã giảm sàn.` },
      { title: 'Dòng tiền', body: `Thanh khoản tập trung ở nhóm vốn hoá lớn. ${lead.name} thu hút dòng tiền nhờ kỳ vọng kết quả kinh doanh quý tới, trong khi ${lag.name.toLowerCase()} bị chốt lời sau nhịp tăng trước đó.` },
      { title: 'Điều cần theo dõi', body: 'Số liệu CPI và quyết định lãi suất của Fed trong tuần có thể tác động tới tỷ giá và dòng vốn ngoại. Mùa công bố kết quả kinh doanh quý đang tới gần.' },
    ],
  })
})
on('GET', '/news', ({ query }) => {
  if (query.ticker) stockOr404(query.ticker)
  return ok(M.news({ ticker: query.ticker?.toUpperCase(), limit: Number(query.limit ?? 20) }))
})
on('GET', '/events', () => ok(M.corporateEvents()))

/* ===== Cổ phiếu ===== */
on('GET', '/stocks', () => ok(M.allSnapshots(), { total: STOCKS.length, sectors: SECTORS }))
on('GET', '/stocks/search', ({ query }) => {
  const q = (query.q ?? '').trim().toLowerCase()
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase()
  const nq = norm(q)
  const list = M.allSnapshots()
    .map((s) => ({ s, score: !q ? 0 : s.ticker.toLowerCase() === q ? 3 : s.ticker.toLowerCase().startsWith(q) ? 2 : norm(s.name).includes(nq) ? 1 : -1 }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || b.s.marketCap - a.s.marketCap)
    .slice(0, Number(query.limit ?? 8))
    .map((x) => x.s)
  return ok(list)
})
on('GET', '/stocks/:t', ({ params }) => {
  const s = stockOr404(params.t)
  const snap = M.snapshot(s.ticker)
  return ok({ ...snap, profile: { founded: s.founded, employees: s.employees, hq: s.hq, ceo: s.ceo, about: s.about } })
})
on('GET', '/stocks/:t/history', ({ params, query }) => {
  const s = stockOr404(params.t)
  const range = query.range ?? '1Y'
  if (range === '1D') return ok(M.intradayBars(s.ticker).map((b) => ({ t: b.t, value: b.close, volume: b.volume })))
  return ok(M.sliceRange(M.dailyBars(s.ticker), range).map((b) => ({ t: b.t, value: b.close, open: b.open, high: b.high, low: b.low, volume: b.volume })))
})
on('GET', '/stocks/:t/financials', ({ params }) => ok(M.financials(stockOr404(params.t).ticker)))
on('GET', '/stocks/:t/earnings', ({ params }) => ok(M.earnings(stockOr404(params.t).ticker)))
on('GET', '/stocks/:t/analysts', ({ params }) => ok(M.analysts(stockOr404(params.t).ticker)))
on('GET', '/stocks/:t/insiders', ({ params }) => ok(M.insiders(stockOr404(params.t).ticker)))
on('GET', '/stocks/:t/foreign', ({ params }) => {
  const s = stockOr404(params.t)
  const snap = M.snapshot(s.ticker)
  return ok({ series: M.foreignFlow(s.ticker), ownership: snap.foreignOwnership, room: snap.foreignRoom })
})
on('GET', '/stocks/:t/peers', ({ params, query }) => {
  const s = stockOr404(params.t)
  const list = query.tickers ? query.tickers.split(',').filter((x) => M.profileOf(x)) : M.peersOf(s.ticker)
  return ok([M.snapshot(s.ticker), ...list.filter((x) => x !== s.ticker).map((x) => M.snapshot(x))])
})

/* ===== Danh sách theo dõi ===== */
const myLists = (d, email) => (d.watchlists[email] ??= [])
on('GET', '/watchlists', ({ headers }) => ok(myLists(db.read(), requireUser(headers))))
on('POST', '/watchlists', ({ headers, body }) => {
  const email = requireUser(headers)
  const name = String(body?.name ?? '').trim()
  if (!name) throw new HttpError(422, 'VALIDATION', 'Tên danh sách không được để trống.')
  return db.tx((d) => {
    const lists = myLists(d, email)
    if (lists.length >= 10) throw new HttpError(422, 'LIMIT', 'Bạn chỉ có thể tạo tối đa 10 danh sách.')
    const tickers = (body.tickers ?? []).filter((t) => M.profileOf(t))
    const wl = { id: uid('wl_'), name: name.slice(0, 40), tickers, createdAt: Date.now() }
    lists.push(wl)
    return created(wl)
  })
})
on('PATCH', '/watchlists/:id', ({ headers, params, body }) => {
  const email = requireUser(headers)
  return db.tx((d) => {
    const wl = myLists(d, email).find((x) => x.id === params.id) ?? notFound()
    if (body.name != null) wl.name = String(body.name).trim().slice(0, 40) || wl.name
    if (Array.isArray(body.tickers)) wl.tickers = [...new Set(body.tickers.filter((t) => M.profileOf(t)))]
    return ok(wl)
  })
})
on('DELETE', '/watchlists/:id', ({ headers, params }) => {
  const email = requireUser(headers)
  return db.tx((d) => {
    d.watchlists[email] = myLists(d, email).filter((x) => x.id !== params.id)
    return noContent()
  })
})
on('POST', '/watchlists/:id/items', ({ headers, params, body }) => {
  const email = requireUser(headers)
  const t = stockOr404(body?.ticker ?? '').ticker
  return db.tx((d) => {
    const wl = myLists(d, email).find((x) => x.id === params.id) ?? notFound()
    if (!wl.tickers.includes(t)) wl.tickers.push(t)
    return ok(wl)
  })
})
on('DELETE', '/watchlists/:id/items/:t', ({ headers, params }) => {
  const email = requireUser(headers)
  return db.tx((d) => {
    const wl = myLists(d, email).find((x) => x.id === params.id) ?? notFound()
    wl.tickers = wl.tickers.filter((x) => x !== params.t.toUpperCase())
    return ok(wl)
  })
})

/* ===== Danh mục nắm giữ ===== */
const myHoldings = (d, email) => (d.holdings[email] ??= [])
function validateHolding(body) {
  const fields = {}
  if (!M.profileOf(body?.ticker ?? '')) fields.ticker = 'Mã cổ phiếu không hợp lệ.'
  if (!(Number(body?.quantity) > 0) || Number(body.quantity) % 10 !== 0) fields.quantity = 'Khối lượng phải là bội số của 10.'
  if (!(Number(body?.avgPrice) > 0)) fields.avgPrice = 'Giá vốn phải lớn hơn 0.'
  if (Object.keys(fields).length) throw new HttpError(422, 'VALIDATION', 'Vui lòng kiểm tra lại thông tin.', fields)
}
on('GET', '/holdings', ({ headers }) => ok(myHoldings(db.read(), requireUser(headers))))
on('POST', '/holdings', ({ headers, body }) => {
  const email = requireUser(headers)
  validateHolding(body)
  return db.tx((d) => {
    const h = { id: uid('h_'), ticker: body.ticker.toUpperCase(), quantity: Number(body.quantity), avgPrice: Number(body.avgPrice), createdAt: Date.now() }
    myHoldings(d, email).push(h)
    return created(h)
  })
})
on('PATCH', '/holdings/:id', ({ headers, params, body }) => {
  const email = requireUser(headers)
  return db.tx((d) => {
    const h = myHoldings(d, email).find((x) => x.id === params.id) ?? notFound()
    validateHolding({ ...h, ...body })
    Object.assign(h, { quantity: Number(body.quantity ?? h.quantity), avgPrice: Number(body.avgPrice ?? h.avgPrice) })
    return ok(h)
  })
})
on('DELETE', '/holdings/:id', ({ headers, params }) => {
  const email = requireUser(headers)
  return db.tx((d) => {
    d.holdings[email] = myHoldings(d, email).filter((x) => x.id !== params.id)
    return noContent()
  })
})

/* ===== Mẫu bộ lọc ===== */
on('GET', '/screener/templates', ({ headers }) => ok(db.read().templates[requireUser(headers)] ?? []))
on('POST', '/screener/templates', ({ headers, body }) => {
  const email = requireUser(headers)
  const name = String(body?.name ?? '').trim()
  if (!name) throw new HttpError(422, 'VALIDATION', 'Vui lòng đặt tên cho mẫu.', { name: 'Vui lòng đặt tên cho mẫu.' })
  return db.tx((d) => {
    const t = { id: uid('tpl_'), name: name.slice(0, 50), filters: body.filters ?? [], sort: body.sort ?? null, createdAt: Date.now() }
    ;(d.templates[email] ??= []).push(t)
    return created(t)
  })
})
on('DELETE', '/screener/templates/:id', ({ headers, params }) => {
  const email = requireUser(headers)
  return db.tx((d) => {
    d.templates[email] = (d.templates[email] ?? []).filter((x) => x.id !== params.id)
    return noContent()
  })
})

/* ===== Gói thành viên, giới thiệu, góp ý ===== */
on('GET', '/subscription', ({ headers }) => ok(db.read().subscriptions[requireUser(headers)]))
on('PATCH', '/subscription', ({ headers, body }) => {
  const email = requireUser(headers)
  if (!['monthly', 'yearly'].includes(body?.plan)) throw new HttpError(422, 'VALIDATION', 'Gói không hợp lệ.')
  return db.tx((d) => {
    const s = d.subscriptions[email]
    Object.assign(s, { plan: body.plan, status: 'active', renewsAt: Date.now() + (body.plan === 'yearly' ? 365 : 30) * 86400000 })
    return ok(s)
  })
})
on('POST', '/subscription/cancel', ({ headers }) => {
  const email = requireUser(headers)
  return db.tx((d) => {
    const s = d.subscriptions[email]
    s.status = 'canceled'
    return ok(s)
  })
})
on('POST', '/subscription/resume', ({ headers }) => {
  const email = requireUser(headers)
  return db.tx((d) => {
    const s = d.subscriptions[email]
    s.status = s.plan === 'trial' ? 'trialing' : 'active'
    return ok(s)
  })
})
on('GET', '/referrals', ({ headers }) => {
  const email = requireUser(headers)
  const list = db.read().referrals[email] ?? []
  return ok({ code: `NHIP-${email.slice(0, 4).toUpperCase()}${list.length}`, list, freeMonths: list.filter((x) => x.status === 'joined').length })
})
on('POST', '/referrals', ({ headers, body }) => {
  const email = requireUser(headers)
  const emails = (body?.emails ?? []).map((e) => String(e).trim().toLowerCase()).filter(Boolean)
  const bad = emails.filter((e) => !validEmail(e))
  if (!emails.length || bad.length) throw new HttpError(422, 'VALIDATION', bad.length ? `Email không hợp lệ: ${bad.join(', ')}` : 'Vui lòng nhập ít nhất một email.')
  return db.tx((d) => {
    const list = (d.referrals[email] ??= [])
    emails.forEach((e) => list.some((x) => x.email === e) || list.push({ email: e, status: 'sent', sentAt: Date.now() }))
    return ok({ sent: emails.length })
  })
})
on('POST', '/feedback', ({ headers, body }) => {
  const email = requireUser(headers)
  const message = String(body?.message ?? '').trim()
  if (message.length < 5) throw new HttpError(422, 'VALIDATION', 'Nội dung góp ý quá ngắn.', { message: 'Hãy viết ít nhất 5 ký tự.' })
  return db.tx((d) => {
    d.feedback.push({ email, message: message.slice(0, 2000), attachments: body.attachments ?? [], at: Date.now() })
    return created({ received: true })
  })
})

/* ---------------- Dispatcher ---------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function handleMockRequest({ method, path, body, headers }) {
  await sleep(env.mockDelay * (0.6 + Math.random() * 0.8))
  const [pathname, qs = ''] = path.split('?')
  const query = Object.fromEntries(new URLSearchParams(qs))
  for (const r of routes) {
    if (r.method !== method) continue
    const m = pathname.match(r.re)
    if (!m) continue
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]))
    try {
      return r.handler({ params, query, body, headers })
    } catch (e) {
      if (e instanceof HttpError) return { status: e.status, body: { error: { code: e.code, message: e.message, fields: e.fields } } }
      console.error('[mock]', e)
      return { status: 500, body: { error: { code: 'INTERNAL', message: 'Lỗi máy chủ mô phỏng.' } } }
    }
  }
  return { status: 404, body: { error: { code: 'NOT_FOUND', message: `Không có API ${method} ${pathname}` } } }
}
