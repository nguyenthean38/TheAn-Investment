import { NavLink } from 'react-router-dom'
import { Search } from 'lucide-react'
import { DOCK_ITEMS } from '@/config/navigation'
import { KeySeq, Kbd } from '@/components/ui'
import { usePreferences } from '@/hooks/useAuth'
import { useUI } from '@/store/ui'
import { cn } from '@/utils/cn'
import { vnNow } from '@/lib/time'

function DockTip({ label, children }) {
  return (
    <span className="pointer-events-none absolute bottom-full left-1/2 mb-3 hidden -translate-x-1/2 items-center gap-2 rounded-xl border border-line-strong bg-canvas px-3 py-2 text-xs whitespace-nowrap text-fg shadow-2xl group-hover/dock:flex group-focus-visible/dock:flex">
      {label}
      {children}
    </span>
  )
}

/** Thanh điều hướng nổi ở đáy màn hình + nút tìm kiếm tròn tách riêng. */
export function Dock() {
  const prefs = usePreferences()
  const openPalette = useUI((s) => s.openPalette)
  if (prefs.hideDock) return null
  const day = vnNow().getDate()
  return (
    <nav aria-label="Điều hướng chính" className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-3 sm:bottom-6">
      <div className="flex max-w-full items-center gap-2">
        <div className="flex items-center gap-0.5 overflow-x-auto rounded-full sm:p-1.5 border border-line-strong bg-raised/85 p-1 shadow-[0_20px_60px_-15px_rgb(0_0_0/0.9)] backdrop-blur-xl scrollbar-none sm:overflow-visible">
          {DOCK_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                aria-label={item.label}
                className={({ isActive }) =>
                  cn(
                    'group/dock relative flex size-9 shrink-0 items-center justify-center rounded-full transition-colors sm:size-10',
                    isActive ? 'bg-hover text-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]' : 'text-muted hover:bg-overlay hover:text-fg',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.calendar ? (
                      <span className="relative flex size-[19px] flex-col overflow-hidden rounded-[5px] border-[1.6px] border-current">
                        <span className="h-[4px] bg-current" />
                        <span className="num flex flex-1 items-center justify-center text-[9px] leading-none font-bold">{day}</span>
                      </span>
                    ) : (
                      <Icon className="size-[19px]" strokeWidth={isActive ? 2.2 : 1.8} />
                    )}
                    {isActive && <span className="absolute -bottom-0.5 h-[3px] w-3 rounded-full bg-brand" />}
                    <DockTip label={item.label}>
                      <KeySeq keys={item.keys} then />
                    </DockTip>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => openPalette('search')}
          aria-label="Tìm cổ phiếu"
          className="group/dock relative flex size-12 shrink-0 items-center justify-center rounded-full border border-line-strong bg-raised/85 text-dim shadow-[0_20px_60px_-15px_rgb(0_0_0/0.9)] backdrop-blur-xl transition-colors hover:text-fg"
        >
          <Search className="size-5" />
          <DockTip label="Tìm cổ phiếu">
            <Kbd>/</Kbd>
          </DockTip>
        </button>
      </div>
    </nav>
  )
}
