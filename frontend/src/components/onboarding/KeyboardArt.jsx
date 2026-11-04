import { cn } from '@/utils/cn'

const ROWS = [
  ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Xoá'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Alt', '⌘', 'Space', '⌘', 'Alt', '←', '→'],
]
const WIDE = { Xoá: 1.6, Tab: 1.5, Caps: 1.8, Enter: 1.9, Shift: 2.3, Space: 6, Ctrl: 1.4, Esc: 1.4 }

/**
 * Bàn phím minh hoạ. `lit`: danh sách phím phát sáng (so khớp không phân biệt hoa thường).
 * `pressed`: phím đang được nhấn (lún xuống).
 */
export function KeyboardArt({ lit = [], pressed = [], className }) {
  const isLit = (k) => lit.some((x) => x.toLowerCase() === k.toLowerCase())
  const isPressed = (k) => pressed.some((x) => x.toLowerCase() === k.toLowerCase())
  return (
    <div
      aria-hidden
      className={cn(
        'relative mx-auto w-full max-w-[640px] rounded-[22px] border border-line-strong bg-gradient-to-b from-[#16161b] to-[#0c0c10] p-2.5 shadow-[0_40px_100px_-30px_rgb(0_0_0/0.9)] sm:p-3.5',
        className,
      )}
    >
      <div className="space-y-1 sm:space-y-1.5">
        {ROWS.map((row, r) => (
          <div key={r} className="flex gap-1 sm:gap-1.5">
            {row.map((k, i) => {
              const on = isLit(k)
              const down = isPressed(k)
              return (
                <span
                  key={`${k}-${i}`}
                  style={{ flex: WIDE[k] ?? 1 }}
                  className={cn(
                    'flex items-center justify-center rounded-md border text-[8px] font-medium transition-all duration-200 sm:rounded-lg sm:text-[11px]',
                    r === 0 ? 'h-5 sm:h-6' : 'h-7 sm:h-10',
                    on
                      ? 'border-brand/70 bg-brand/15 text-brand-soft shadow-[0_0_24px_rgb(255_163_108/0.55),inset_0_1px_0_rgb(255_255_255/0.15)]'
                      : 'border-line bg-[#141418] text-faint shadow-[inset_0_-2px_0_rgb(0_0_0/0.5)]',
                    down && 'translate-y-px scale-[0.96] bg-brand/30',
                  )}
                >
                  {k}
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
