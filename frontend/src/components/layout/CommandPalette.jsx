import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, BookOpen, ChevronLeft, CornerDownLeft, FileText, Gift, Keyboard, LogOut, MessageSquare, Newspaper, Search, Sparkles, Star, Target } from 'lucide-react'
import { DOCK_ITEMS } from '@/config/navigation'
import { ChangePill, ExchangeBadge, Kbd, KeySeq, LogoMark, TickerLogo } from '@/components/ui'
import { useOverlayBehavior } from '@/components/ui/Overlay'
import { useStockSearch, useStocks } from '@/hooks/useMarket'
import { useLogout } from '@/hooks/useAuth'
import { useToggleWatch, useWatchedSet } from '@/hooks/useWatchlists'
import { useUI } from '@/store/ui'
import { recentTickers } from '@/utils/recent'
import { FeedbackPanel } from './FeedbackPanel'
import { formatPrice } from '@/utils/format'
import { cn } from '@/utils/cn'

const POPULAR = ['FPT', 'HPG', 'VCB', 'MWG', 'SSI', 'DGC']

/** Hành động theo mã cổ phiếu (hiện khi kết quả tìm kiếm khớp chính xác). */
const stockActions = (t) => [
  { id: `go-${t}`, label: `Mở trang ${t}`, icon: ArrowRight, to: `/app/co-phieu/${t}` },
  { id: `an-${t}`, label: `Khuyến nghị & giá mục tiêu ${t}`, icon: Target, to: `/app/co-phieu/${t}#khuyen-nghi`, kbd: 'A' },
  { id: `ea-${t}`, label: `Kết quả kinh doanh ${t}`, icon: BarChart3, to: `/app/co-phieu/${t}#ket-qua`, kbd: 'E' },
  { id: `fi-${t}`, label: `Báo cáo tài chính ${t}`, icon: FileText, to: `/app/co-phieu/${t}#tai-chinh`, kbd: 'F' },
  { id: `nw-${t}`, label: `Tin tức ${t}`, icon: Newspaper, to: `/app/co-phieu/${t}#tin-tuc` },
]

/**
 * Bảng lệnh (Ctrl/⌘ K): tìm cổ phiếu, chuyển trang, chạy hành động.
 * Ô nhập nằm ở ĐÁY bảng, kết quả ở trên — điều hướng bằng ↑ ↓ và Enter.
 */
export function CommandPalette() {
  const { open, mode } = useUI((s) => s.palette)
  const close = useUI((s) => s.closePalette)
  if (!open) return null
  if (mode === 'feedback') return <FeedbackPanel onClose={close} />
  return <PalettePanel key={mode} mode={mode} onClose={close} />
}

function PalettePanel({ mode, onClose }) {
  const navigate = useNavigate()
  const panelRef = useOverlayBehavior(true, onClose)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const setShortcutsOpen = useUI((s) => s.setShortcutsOpen)
  const setWatchPanelOpen = useUI((s) => s.setWatchPanelOpen)
  const setPaletteMode = useUI((s) => s.setPaletteMode)
  const openFeedback = useUI((s) => s.openPalette)
  const logout = useLogout()
  const toggleWatch = useToggleWatch()
  const watched = useWatchedSet()

  const term = q.trim()
  const isSearch = mode === 'search'
  const { data: results = [], isFetching } = useStockSearch(term, isSearch ? 8 : 5)
  const recent = recentTickers.get()
  const { data: all = [] } = useStocks()
  const byTicker = useMemo(() => new Map(all.map((s) => [s.ticker, s])), [all])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const groups = useMemo(() => {
    const go = (to) => () => {
      onClose()
      navigate(to)
    }
    const stockItem = (s) => ({
      id: `s-${s.ticker}`,
      kind: 'stock',
      stock: s,
      run: () => {
        recentTickers.push(s.ticker)
        go(`/app/co-phieu/${s.ticker}`)()
      },
    })
    const out = []
    if (isSearch && !term) {
      const recentStocks = recent.map((t) => byTicker.get(t)).filter(Boolean)
      if (recentStocks.length) out.push({ title: 'Gần đây', items: recentStocks.map(stockItem) })
      out.push({ title: 'Phổ biến', items: POPULAR.map((t) => byTicker.get(t) ?? { ticker: t }).map(stockItem) })
      return out
    }
    if (term && results.length) {
      out.push({ title: 'Cổ phiếu', items: results.map(stockItem) })
      const exact = results.find((r) => r.ticker.toLowerCase() === term.toLowerCase()) ?? (isSearch ? results[0] : null)
      if (exact) {
        out.push({
          title: exact.name,
          items: [
            ...stockActions(exact.ticker).map((a) => ({ ...a, kind: 'action', badge: exact.ticker, run: go(a.to) })),
            {
              id: `w-${exact.ticker}`,
              kind: 'action',
              label: watched.has(exact.ticker) ? `Bỏ theo dõi ${exact.ticker}` : `Thêm ${exact.ticker} vào danh sách theo dõi`,
              icon: Star,
              badge: exact.ticker,
              run: () => toggleWatch.mutate(exact.ticker),
            },
          ],
        })
      }
    }
    if (!isSearch) {
      const match = (label) => !term || label.toLowerCase().includes(term.toLowerCase())
      const pages = DOCK_ITEMS.filter((d) => match(d.label)).map((d) => ({ id: d.to, kind: 'page', label: `Tới ${d.label}`, icon: d.icon, keys: d.keys, run: go(d.to) }))
      if (pages.length) out.push({ title: 'Chuyển trang', items: pages })
      const actions = [
        { id: 'search', label: 'Tìm cổ phiếu', icon: Search, kbd: '/', run: () => setPaletteMode('search') },
        { id: 'watch', label: 'Mở danh sách theo dõi', icon: Star, kbd: 'W', run: () => (onClose(), setWatchPanelOpen(true)) },
        { id: 'recap', label: 'Đọc bản tin thị trường hôm nay', icon: Sparkles, run: go('/app#ban-tin') },
        { id: 'keys', label: 'Bảng phím tắt', icon: Keyboard, kbd: '?', run: () => (onClose(), setShortcutsOpen(true)) },
        { id: 'feedback', label: 'Gửi góp ý', icon: MessageSquare, run: () => openFeedback('feedback') },
        { id: 'refer', label: 'Giới thiệu bạn bè', icon: Gift, run: go('/app/cai-dat#gioi-thieu') },
        { id: 'guide', label: 'Hướng dẫn sử dụng', icon: BookOpen, run: go('/bat-dau?xem-lai=1') },
        { id: 'logout', label: 'Đăng xuất', icon: LogOut, run: () => (onClose(), logout.mutate(undefined, { onSettled: () => navigate('/') })) },
      ].filter((a) => match(a.label))
      if (actions.length) out.push({ title: 'Hành động', items: actions.map((a) => ({ ...a, kind: 'action' })) })
    }
    return out
  }, [isSearch, term, results, recent, byTicker, navigate, onClose, watched, toggleWatch, setPaletteMode, setShortcutsOpen, setWatchPanelOpen, openFeedback, logout])

  const flat = groups.flatMap((g) => g.items)
  const safeActive = Math.min(active, Math.max(0, flat.length - 1))

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [safeActive])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % Math.max(1, flat.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + flat.length) % Math.max(1, flat.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      flat[safeActive]?.run()
    } else if (e.key === 'Backspace' && !q && isSearch) {
      setPaletteMode('root')
    }
  }

  let idx = -1
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-3 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-[3px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={isSearch ? 'Tìm cổ phiếu' : 'Bảng lệnh'}
        tabIndex={-1}
        className="relative flex max-h-[70vh] w-full max-w-[640px] animate-pop flex-col overflow-hidden rounded-[22px] border border-line-strong bg-raised shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9)] outline-none"
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2">
          <button
            type="button"
            onClick={() => (isSearch ? setPaletteMode('root') : onClose())}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-overlay py-1 pr-3 pl-1.5 text-xs font-medium text-dim hover:text-fg"
          >
            {isSearch ? <ChevronLeft className="size-3.5" /> : <LogoMark size={16} />}
            {isSearch ? 'Tìm cổ phiếu' : 'Nhịp'}
          </button>
          <span className="hidden text-[11px] text-faint sm:inline">
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> để chọn · <Kbd>Enter</Kbd> để mở
          </span>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-2 pb-2" role="listbox">
          {groups.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted">{isFetching ? 'Đang tìm…' : `Không tìm thấy kết quả cho "${term}".`}</div>
          )}
          {groups.map((g) => (
            <div key={g.title} className="pt-2">
              <div className="truncate px-3 pb-1.5 text-[11.5px] font-medium text-faint">{g.title}</div>
              {g.items.map((item) => {
                idx += 1
                const i = idx
                const isActive = i === safeActive
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-active={isActive}
                    onMouseMove={() => setActive(i)}
                    onClick={item.run}
                    className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors', isActive ? 'bg-hover' : 'hover:bg-overlay')}
                  >
                    {item.kind === 'stock' ? <StockOption s={item.stock} /> : <ActionOption item={item} />}
                    {isActive && <CornerDownLeft className="size-3.5 shrink-0 text-faint" aria-hidden />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="border-t border-line bg-surface p-2">
          <div className="flex h-11 items-center gap-2.5 rounded-xl px-3">
            <Search className="size-4 shrink-0 text-muted" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setActive(0)
              }}
              onKeyDown={onKeyDown}
              placeholder={isSearch ? 'Nhập mã hoặc tên công ty — VD: FPT, sữa, thép…' : 'Gõ lệnh hoặc tìm mã cổ phiếu…'}
              aria-label={isSearch ? 'Tìm cổ phiếu' : 'Tìm lệnh'}
              className="h-full flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-faint"
            />
            <Kbd>Esc</Kbd>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function StockOption({ s }) {
  return (
    <>
      <TickerLogo ticker={s.ticker} color={s.color} size={30} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-fg">{s.ticker}</span>
        <span className="block truncate text-xs text-muted">{s.name ?? '…'}</span>
      </span>
      {s.price != null && (
        <span className="hidden items-center gap-2 sm:flex">
          <span className="num text-[13px] text-dim">{formatPrice(s.price)}</span>
          <ChangePill value={s.changePct} size="sm" />
        </span>
      )}
      {s.exchange && <ExchangeBadge exchange={s.exchange} />}
    </>
  )
}

function ActionOption({ item }) {
  const Icon = item.icon
  return (
    <>
      <span className="flex size-[30px] shrink-0 items-center justify-center rounded-lg border border-line-strong bg-overlay text-dim">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-fg">{item.label}</span>
      {item.badge && <span className="rounded-md bg-overlay px-1.5 py-0.5 text-[11px] font-semibold text-dim">{item.badge}</span>}
      {item.keys && <KeySeq keys={item.keys} then />}
      {item.kbd && <Kbd>{item.kbd}</Kbd>}
    </>
  )
}
