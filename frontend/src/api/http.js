/**
 * HTTP client duy nhất của ứng dụng.
 * - VITE_USE_MOCK=true  → chuyển request tới mock server trong trình duyệt.
 * - VITE_USE_MOCK=false → fetch tới VITE_API_URL (backend thật).
 * Tự gắn `Authorization: Bearer <token>`. Lỗi trả về dạng { error: { code, message, fields } }.
 */
import { env } from '@/config/env'
import { storage } from '@/utils/storage'

export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields ?? null
  }
}

const TOKEN_KEY = 'nhip.token'
export const tokenStore = {
  get: () => storage.get(TOKEN_KEY),
  set: (t) => storage.set(TOKEN_KEY, t),
  clear: () => storage.remove(TOKEN_KEY),
}

function buildQuery(params) {
  if (!params) return ''
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) continue
    sp.set(k, Array.isArray(v) ? v.join(',') : String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn)

async function request(method, path, { params, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let status
  let json
  if (env.useMock) {
    const { handleMockRequest } = await import('./mock/server')
    const res = await handleMockRequest({ method, path: path + buildQuery(params), body, headers })
    status = res.status
    json = res.body
  } else {
    const res = await fetch(env.apiUrl + path + buildQuery(params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    status = res.status
    json = status === 204 ? null : await res.json().catch(() => null)
  }

  if (status >= 400) {
    if (status === 401) {
      tokenStore.clear()
      onUnauthorized()
    }
    const err = json?.error ?? {}
    throw new ApiError(status, err.code ?? 'INTERNAL', err.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.', err.fields)
  }
  return json
}

const unwrap = (p) => p.then((r) => r?.data ?? null)

export const http = {
  get: (path, params) => unwrap(request('GET', path, { params })),
  post: (path, body) => unwrap(request('POST', path, { body })),
  patch: (path, body) => unwrap(request('PATCH', path, { body })),
  delete: (path) => unwrap(request('DELETE', path)),
}
