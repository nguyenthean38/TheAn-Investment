import { Suspense, useEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Keyboard, Star } from 'lucide-react'
import { DOCK_ITEMS } from '@/config/navigation'
import { brand } from '@/config/brand'
import { LogoMark, Spinner, Tooltip, Kbd } from '@/components/ui'
import { useMe, usePreferences } from '@/hooks/useAuth'
import { isTypingTarget } from '@/hooks/useHotkeys'
import { useUI } from '@/store/ui'
import { storage } from '@/utils/storage'
import { setPriceUnit } from '@/utils/format'
import { Dock } from './Dock'
import { CommandPalette } from './CommandPalette'
import { ShortcutsDrawer } from './ShortcutsDrawer'
import { WatchPanel } from './WatchPanel'

/** Màn hình chờ khi đang xác thực. */
export function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <LogoMark size={44} className="animate-pulse" />
    </div>
  )
}

export function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner />
    </div>
  )
}

/** Phím tắt toàn cục: Ctrl/⌘K, /, ?, W, chuỗi "G rồi …". */
function useGlobalHotkeys(onNavigateByKey) {
  const navigate = useNavigate()
  const ui = useUI
  useEffect(() => {
    let pendingG = null
    const clearG = () => {
      clearTimeout(pendingG)
      pendingG = null
      window.__nhipPendingG = false
    }
    const onKey = (e) => {
      const { palette, openPalette, closePalette, setShortcutsOpen, setWatchPanelOpen } = ui.getState()
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        palette.open ? closePalette() : openPalette('root')
        return
      }
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      if (document.querySelector('[aria-modal="true"]')) return
      if (pendingG) {
        const item = DOCK_ITEMS.find((d) => d.keys[1].toLowerCase() === e.key.toLowerCase())
        clearG()
        if (item) {
          e.preventDefault()
          onNavigateByKey()
          navigate(item.to)
        }
        return
      }
      if (e.key === 'g' || e.key === 'G') {
        window.__nhipPendingG = true
        pendingG = setTimeout(clearG, 1200)
        return
      }
      if (e.key === '/') {
        e.preventDefault()
        openPalette('search')
      } else if (e.key === '?') {
        e.preventDefault()
        setShortcutsOpen(true)
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        setWatchPanelOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearG()
    }
  }, [navigate, ui, onNavigateByKey])
}

/** Gợi ý phím tắt: lần đầu bấm dock tới 1 trang → toast "Lần sau, nhấn G rồi A". */
function useShortcutHints(byKeyRef) {
  const location = useLocation()
  const prefs = usePreferences()
  const toast = useUI((s) => s.toast)
  const prevPath = useRef(null)
  useEffect(() => {
    // Bỏ qua lần render đầu (và lần chạy lại của StrictMode) — chỉ gợi ý khi thực sự chuyển trang
    const prev = prevPath.current
    prevPath.current = location.pathname
    if (prev === null || prev === location.pathname) return
    if (byKeyRef.current) {
      byKeyRef.current = false
      return
    }
    if (prefs.hideHints) return
    const item = DOCK_ITEMS.find((d) => (d.end ? location.pathname === d.to : location.pathname.startsWith(d.to)))
    if (!item) return
    const seen = storage.get('nhip.hints', [])
    if (seen.includes(item.to)) return
    storage.set('nhip.hints', [...seen, item.to])
    toast(`Mẹo: lần sau nhấn ${item.keys[0]} rồi ${item.keys[1]} để tới ${item.label}.`, 'info')
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps
}

/** Bố cục ứng dụng (cần đăng nhập): nội dung + dock nổi + bảng lệnh + ngăn phụ. */
export function AppLayout() {
  const { data: me, isLoading } = useMe()
  const location = useLocation()
  const byKeyRef = useRef(false)
  const setShortcutsOpen = useUI((s) => s.setShortcutsOpen)
  const setWatchPanelOpen = useUI((s) => s.setWatchPanelOpen)
  useGlobalHotkeys(useRef(() => (byKeyRef.current = true)).current)
  useShortcutHints(byKeyRef)

  // Cuộn tới mục theo hash (#tai-chinh…) sau khi trang tải xong
  useEffect(() => {
    if (!location.hash) return
    const id = decodeURIComponent(location.hash.slice(1))
    let tries = 0
    const t = setInterval(() => {
      const el = document.getElementById(id)
      if (el || ++tries > 20) {
        clearInterval(t)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 120)
    return () => clearInterval(t)
  }, [location.pathname, location.hash])

  const priceUnit = me?.preferences?.priceUnit ?? 'dong'
  setPriceUnit(priceUnit) // đặt trước khi trang con render

  if (isLoading) return <Splash />
  if (!me) return <Navigate to={`/dang-nhap?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (!me.onboarded) return <Navigate to="/bat-dau" replace />

  return (
    <div className="relative min-h-dvh bg-canvas pb-32">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] glow-brand opacity-60" aria-hidden />
      <div className="relative">
        <Suspense fallback={<PageFallback />}>
          {/* key: vẽ lại toàn bộ trang khi đổi đơn vị giá */}
          <div key={priceUnit}>
            <Outlet />
          </div>
        </Suspense>
        <p className="container-app mt-16 text-center text-[11.5px] text-faint">{brand.disclaimer}</p>
      </div>

      {/* Nút góc màn hình */}
      <div className="fixed bottom-7 left-6 z-20 hidden xl:block">
        <Tooltip align="start" label={<span className="flex items-center gap-2">Phím tắt <Kbd>?</Kbd></span>}>
          <button type="button" onClick={() => setShortcutsOpen(true)} aria-label="Bảng phím tắt" className="rounded-full p-2 text-faint transition-colors hover:bg-raised hover:text-fg">
            <Keyboard className="size-5" />
          </button>
        </Tooltip>
      </div>
      <div className="fixed right-6 bottom-7 z-20 hidden xl:block">
        <Tooltip align="end" label={<span className="flex items-center gap-2">Theo dõi <Kbd>W</Kbd></span>}>
          <button type="button" onClick={() => setWatchPanelOpen(true)} aria-label="Danh sách theo dõi" className="rounded-full p-2 text-faint transition-colors hover:bg-raised hover:text-fg">
            <Star className="size-5" />
          </button>
        </Tooltip>
      </div>

      <Dock />
      <CommandPalette />
      <ShortcutsDrawer />
      <WatchPanel />
    </div>
  )
}
