import { useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Kbd, Popover } from '@/components/ui'
import { cn } from '@/utils/cn'
import { FILTER_DEFS, getDef } from './filters'

/** Popover 2 bước: chọn tiêu chí → chọn giá trị. */
export function AddFilterPopover({ open, onClose, filters, onAdd }) {
  return (
    <Popover open={open} onClose={onClose} className="w-[300px] p-0">
      {open && <Body filters={filters} onAdd={onAdd} onClose={onClose} />}
    </Popover>
  )
}

function Body({ filters, onAdd, onClose }) {
  const [q, setQ] = useState('')
  const [step, setStep] = useState(null)
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [step])

  const def = step ? getDef(step) : null
  const term = q.trim().toLowerCase()
  const items = def
    ? def.options.filter((o) => !term || o.label.toLowerCase().includes(term)).map((o) => ({ key: o.value, label: o.label, selected: filters.some((f) => f.id === def.id && f.value === o.value) }))
    : FILTER_DEFS.filter((d) => !term || d.label.toLowerCase().includes(term)).map((d) => ({ key: d.id, label: d.label, used: filters.find((f) => f.id === d.id) }))

  const choose = (item) => {
    if (!item) return
    if (def) {
      onAdd({ id: def.id, value: item.key })
      onClose()
    } else {
      setStep(item.key)
      setQ('')
      setActive(0)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(items.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(items[active])
    } else if (e.key === 'Backspace' && !q && step) {
      e.preventDefault()
      setStep(null)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        {def ? (
          <button type="button" onClick={() => setStep(null)} aria-label="Quay lại" className="rounded-md p-0.5 text-muted hover:text-fg">
            <ChevronLeft className="size-4" />
          </button>
        ) : (
          <Search className="size-4 text-muted" />
        )}
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          placeholder={def ? `Chọn ${def.label.toLowerCase()}…` : 'Tìm tiêu chí lọc…'}
          aria-label="Tìm tiêu chí"
          className="h-7 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
        />
        {!def && <Kbd>S</Kbd>}
      </div>
      {def && <div className="px-4 pt-2.5 pb-1 text-[11.5px] font-medium text-faint">{def.label}</div>}
      <ul className="max-h-72 overflow-y-auto p-1.5" role="listbox">
        {items.map((it, i) => (
          <li key={it.key}>
            <button
              type="button"
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => choose(it)}
              className={cn('flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm', i === active ? 'bg-hover text-fg' : 'text-dim')}
            >
              <span className="truncate">{it.label}</span>
              {it.used && <span className="truncate text-xs text-brand">đang lọc</span>}
              {it.selected && <Check className="size-4 text-brand" />}
              {!def && !it.used && <ChevronRight className="size-3.5 text-faint" />}
            </button>
          </li>
        ))}
        {!items.length && <li className="px-3 py-6 text-center text-sm text-muted">Không có tiêu chí phù hợp.</li>}
      </ul>
    </div>
  )
}
