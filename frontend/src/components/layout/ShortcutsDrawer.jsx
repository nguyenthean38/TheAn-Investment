import { useState } from 'react'
import { Search } from 'lucide-react'
import { SHORTCUT_GROUPS } from '@/config/navigation'
import { Drawer, KeySeq } from '@/components/ui'
import { useUI } from '@/store/ui'

/** Ngăn "Phím tắt" (mở bằng phím ?) có ô lọc. */
export function ShortcutsDrawer() {
  const open = useUI((s) => s.shortcutsOpen)
  const setOpen = useUI((s) => s.setShortcutsOpen)
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()
  const groups = SHORTCUT_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !term || i.label.toLowerCase().includes(term)) })).filter((g) => g.items.length)
  return (
    <Drawer open={open} onClose={() => setOpen(false)} title="Phím tắt">
      <div className="p-5">
        <div className="mb-5 flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-base px-3">
          <Search className="size-4 text-muted" />
          <input
            data-autofocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm phím tắt…"
            aria-label="Tìm phím tắt"
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
          />
        </div>
        {groups.map((g) => (
          <div key={g.title} className="mb-6">
            <h3 className="ds-label mb-2">{g.title}</h3>
            <ul>
              {g.items.map((i) => (
                <li key={i.label} className="flex items-center justify-between gap-4 border-b border-line py-2.5 text-sm text-dim last:border-0">
                  {i.label}
                  <KeySeq keys={i.keys} then={i.then} />
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!groups.length && <p className="py-10 text-center text-sm text-muted">Không có phím tắt phù hợp.</p>}
      </div>
    </Drawer>
  )
}
