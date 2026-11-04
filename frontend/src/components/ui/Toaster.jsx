import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useUI } from '@/store/ui'
import { cn } from '@/utils/cn'

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info }
const TONES = { success: 'text-up', error: 'text-down', info: 'text-brand' }

/** Toast ở giữa phía trên màn hình. Gọi `useUI.getState().toast(msg, tone)`. */
export function Toaster() {
  const toasts = useUI((s) => s.toasts)
  const dismiss = useUI((s) => s.dismissToast)
  return (
    <div className="pointer-events-none fixed top-5 left-1/2 z-[70] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone] ?? Info
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex animate-slide-up items-center gap-3 rounded-full border border-line-strong bg-raised/95 py-2 pr-2 pl-4 shadow-2xl backdrop-blur"
          >
            <Icon className={cn('size-4 shrink-0', TONES[t.tone])} aria-hidden />
            <span className="text-[13px] text-fg">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Đóng thông báo" className="rounded-full p-1 text-muted hover:bg-hover hover:text-fg">
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
