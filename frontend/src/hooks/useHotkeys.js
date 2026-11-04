import { useEffect, useRef } from 'react'

/** Bỏ qua phím tắt khi đang gõ trong ô nhập hoặc khi có modal mở. */
export function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

const overlayOpen = () => !!document.querySelector('[aria-modal="true"]')

/**
 * Đăng ký phím tắt đơn (không modifier) cho trang hiện tại.
 * map: { a: () => …, '[': () => … }. Tự bỏ qua khi đang gõ hoặc có overlay.
 */
export function useHotkeys(map, { enabled = true, allowInOverlay = false } = {}) {
  const ref = useRef(map)
  useEffect(() => {
    ref.current = map
  })
  useEffect(() => {
    if (!enabled) return
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
      if (isTypingTarget(e.target)) return
      if (!allowInOverlay && overlayOpen()) return
      if (window.__nhipPendingG) return // đang chờ phím thứ 2 của chuỗi "G rồi …"
      const fn = ref.current[e.key] ?? ref.current[e.key.toLowerCase()]
      if (fn) {
        e.preventDefault()
        fn(e)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, allowInOverlay])
}
