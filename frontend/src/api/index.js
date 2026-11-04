/** Các service gọi API — mỗi hàm ứng với 1 endpoint trong docs/API_CONTRACT.md. */
import { http } from './http'

export const authApi = {
  requestMagicLink: (email) => http.post('/auth/magic-link', { email }),
  verify: (email, name) => http.post('/auth/verify', { email, name }),
  demo: () => http.post('/auth/demo'),
  logout: () => http.post('/auth/logout'),
  me: () => http.get('/me'),
  updateMe: (patch) => http.patch('/me', patch),
}

export const marketApi = {
  overview: () => http.get('/market/overview'),
  indexHistory: (code, range) => http.get(`/market/indices/${code}/history`, { range }),
  sectors: () => http.get('/market/sectors'),
  movers: () => http.get('/market/movers'),
  foreign: () => http.get('/market/foreign'),
  global: () => http.get('/market/global'),
  macro: () => http.get('/market/macro'),
  insiders: (params) => http.get('/market/insiders', params),
  recap: () => http.get('/market/recap'),
  news: (params) => http.get('/news', params),
  events: () => http.get('/events'),
}

export const stockApi = {
  list: () => http.get('/stocks'),
  search: (q, limit) => http.get('/stocks/search', { q, limit }),
  get: (t) => http.get(`/stocks/${t}`),
  history: (t, range) => http.get(`/stocks/${t}/history`, { range }),
  financials: (t) => http.get(`/stocks/${t}/financials`),
  earnings: (t) => http.get(`/stocks/${t}/earnings`),
  analysts: (t) => http.get(`/stocks/${t}/analysts`),
  insiders: (t) => http.get(`/stocks/${t}/insiders`),
  foreign: (t) => http.get(`/stocks/${t}/foreign`),
  peers: (t, tickers) => http.get(`/stocks/${t}/peers`, { tickers }),
}

export const watchlistApi = {
  list: () => http.get('/watchlists'),
  create: (name, tickers) => http.post('/watchlists', { name, tickers }),
  update: (id, patch) => http.patch(`/watchlists/${id}`, patch),
  remove: (id) => http.delete(`/watchlists/${id}`),
  addItem: (id, ticker) => http.post(`/watchlists/${id}/items`, { ticker }),
  removeItem: (id, ticker) => http.delete(`/watchlists/${id}/items/${ticker}`),
}

export const holdingApi = {
  list: () => http.get('/holdings'),
  create: (body) => http.post('/holdings', body),
  update: (id, body) => http.patch(`/holdings/${id}`, body),
  remove: (id) => http.delete(`/holdings/${id}`),
}

export const accountApi = {
  templates: () => http.get('/screener/templates'),
  saveTemplate: (body) => http.post('/screener/templates', body),
  deleteTemplate: (id) => http.delete(`/screener/templates/${id}`),
  subscription: () => http.get('/subscription'),
  changePlan: (plan) => http.patch('/subscription', { plan }),
  cancelSubscription: () => http.post('/subscription/cancel'),
  resumeSubscription: () => http.post('/subscription/resume'),
  referrals: () => http.get('/referrals'),
  sendReferrals: (emails) => http.post('/referrals', { emails }),
  feedback: (body) => http.post('/feedback', body),
}
