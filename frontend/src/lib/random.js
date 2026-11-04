/** PRNG có seed (mulberry32) — dữ liệu mô phỏng ổn định giữa các lần tải trang. */
export function hashString(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return (h >>> 0) || 1
}

export function rng(seed) {
  let a = typeof seed === 'string' ? hashString(seed) : seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Phân phối chuẩn (Box–Muller). */
export function gaussian(r) {
  const u = Math.max(r(), 1e-9)
  const v = r()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
export const between = (r, min, max) => min + r() * (max - min)
