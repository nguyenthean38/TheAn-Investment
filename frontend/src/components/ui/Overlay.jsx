import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

/** Khoá scroll body + đóng bằng Esc + trả focus khi overlay đóng. */
export function useOverlayBehavior(open, onClose) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })
  // Chỉ phụ thuộc `open`: tránh chạy lại (và cướp focus) mỗi khi parent render lại.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const prevFocus = document.activeElement
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current?.()
      }
    }
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => {
      const el = panelRef.current
      if (el && !el.contains(document.activeElement)) (el.querySelector('[data-autofocus]') ?? el).focus()
    })
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      prevFocus?.focus?.()
    }
  }, [open])
  return panelRef
}

const SIZES = { sm: 'max-w-[420px]', md: 'max-w-[560px]', lg: 'max-w-[840px]', xl: 'max-w-[1120px]' }

/** Modal nền tối mờ, panel bo góc lớn. */
export function Modal({ open, onClose, title, description, size = 'md', children, footer, className, bodyClassName, hideClose = false }) {
  const panelRef = useOverlayBehavior(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'relative flex max-h-[92vh] w-full animate-pop flex-col overflow-hidden rounded-t-3xl border border-line-strong bg-surface shadow-2xl outline-none sm:rounded-3xl',
          SIZES[size],
          className,
        )}
      >
        {(title || !hideClose) && (
          <header className="flex shrink-0 items-start justify-between gap-4 px-6 pt-6">
            <div className="min-w-0">
              {title && <h2 className="ds-h2">{title}</h2>}
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            {!hideClose && (
              <button type="button" onClick={onClose} aria-label="Đóng" className="-mt-1 -mr-2 rounded-full p-2 text-muted transition-colors hover:bg-raised hover:text-fg">
                <X className="size-5" />
              </button>
            )}
          </header>
        )}
        <div className={cn('overflow-y-auto px-6 pt-4 pb-6', bodyClassName)}>{children}</div>
        {footer && <footer className="shrink-0 border-t border-line px-6 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}

/** Ngăn trượt từ phải, nền đen, bo góc (danh sách theo dõi, phím tắt). */
export function Drawer({ open, onClose, title, headerRight, footer, children, width = 'max-w-[460px]', className, bodyClassName }) {
  const panelRef = useOverlayBehavior(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={onClose} aria-hidden />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'absolute top-2 right-2 bottom-2 flex w-[calc(100%-16px)] animate-slide-in-right flex-col overflow-hidden rounded-3xl border border-line-strong bg-canvas shadow-2xl outline-none',
          width,
          className,
        )}
      >
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line px-5">
          <div className="min-w-0 text-[15px] font-semibold">{title}</div>
          <div className="flex items-center gap-1.5">
            {headerRight}
            <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-full p-2 text-muted transition-colors hover:bg-raised hover:text-fg">
              <X className="size-5" />
            </button>
          </div>
        </header>
        <div className={cn('flex-1 overflow-y-auto', bodyClassName)}>{children}</div>
        {footer && <footer className="shrink-0 border-t border-line px-5 py-4">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  )
}

/** Popover neo theo phần tử cha (relative). Đóng khi bấm ra ngoài / Esc. */
export function Popover({ open, onClose, children, className, align = 'left' }) {
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })
  useEffect(() => {
    if (!open) return
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && onCloseRef.current?.()
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current?.()
    const id = setTimeout(() => document.addEventListener('mousedown', onDown))
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(id)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  if (!open) return null
  return (
    <div
      ref={ref}
      className={cn(
        'absolute top-full z-30 mt-2 min-w-56 animate-pop rounded-2xl border border-line-strong bg-raised p-1.5 shadow-2xl',
        align === 'right' ? 'right-0' : 'left-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
