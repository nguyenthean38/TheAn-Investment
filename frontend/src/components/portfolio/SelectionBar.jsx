import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowRightLeft, LineChart, ListPlus, Trash2, X } from 'lucide-react'
import { Button, Kbd, Popover } from '@/components/ui'

/** Thanh hành động nổi khi chọn nhiều mã (đè lên vị trí thanh dock). */
export function SelectionBar({ count, tickers, lists, onMove, onMoveToNew, onDelete, onCancel }) {
  const navigate = useNavigate()
  const [moveOpen, setMoveOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const none = count === 0
  const run = async (fn) => {
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 sm:bottom-6" role="toolbar" aria-label="Thao tác với mã đã chọn">
      <div className="flex max-w-full animate-slide-up items-center gap-1 overflow-x-auto rounded-full border border-line-strong bg-raised/95 p-1.5 shadow-[0_20px_60px_-15px_rgb(0_0_0/0.95)] backdrop-blur-xl scrollbar-none sm:overflow-visible">
        <button type="button" onClick={onCancel} aria-label="Bỏ chọn" className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-overlay hover:text-fg">
          <X className="size-4" />
        </button>
        <span className="num shrink-0 px-2 text-sm font-medium whitespace-nowrap">
          <span className="text-brand">{count}</span> mã đã chọn
        </span>
        <span className="mx-1 h-5 w-px shrink-0 bg-line-strong" />
        <Button size="sm" variant="ghost" disabled={none || tickers.length < 1} onClick={() => navigate(`/app/so-sanh?tickers=${tickers.slice(0, 8).join(',')}`)}>
          <LineChart className="size-4" /> <span className="hidden sm:inline">So sánh biểu đồ</span>
        </Button>
        <div className="relative shrink-0">
          <Button size="sm" variant="ghost" disabled={none || busy} onClick={() => setMoveOpen((o) => !o)} aria-expanded={moveOpen}>
            <ArrowRightLeft className="size-4" /> <span className="hidden sm:inline">Chuyển sang danh sách</span>
          </Button>
          <Popover open={moveOpen} onClose={() => setMoveOpen(false)} className="top-auto bottom-full mt-0 mb-3 w-64">
            <div className="px-2.5 pt-1.5 pb-1 text-[11.5px] text-faint">Danh sách của bạn</div>
            {lists.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  setMoveOpen(false)
                  run(() => onMove(l))
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-hover"
              >
                <span className="truncate">{l.name}</span>
                <span className="text-xs text-faint">{l.tickers.length}</span>
              </button>
            ))}
            <div className="my-1 h-px bg-line" />
            <button
              type="button"
              onClick={() => {
                setMoveOpen(false)
                onMoveToNew()
              }}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left text-sm text-brand hover:bg-hover"
            >
              <span className="inline-flex items-center gap-2">
                <ListPlus className="size-4" /> Tạo danh sách mới
              </span>
            </button>
          </Popover>
        </div>
        <Button size="sm" variant="danger" disabled={none || busy} onClick={() => run(onDelete)}>
          <Trash2 className="size-4" /> <span className="hidden sm:inline">Xoá</span>
        </Button>
        <span className="hidden shrink-0 pr-2 pl-1 text-[11px] text-faint md:inline">
          <Kbd>Esc</Kbd> để thoát
        </span>
      </div>
    </div>,
    document.body,
  )
}
