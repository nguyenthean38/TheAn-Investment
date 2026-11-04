import { storage } from './storage'

const KEY = 'nhip.recent'

/** Lịch sử mã cổ phiếu đã xem gần đây (tối đa 6). */
export const recentTickers = {
  get: () => storage.get(KEY, []),
  push(ticker) {
    const list = [ticker, ...storage.get(KEY, []).filter((t) => t !== ticker)].slice(0, 6)
    storage.set(KEY, list)
  },
  clear: () => storage.remove(KEY),
}
