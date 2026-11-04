import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowDownAZ, ArrowUpDown, CheckSquare, GripVertical, ListPlus, Plus, Search, Star, X } from 'lucide-react'
import { Button, ChangePill, Checkbox, EmptyState, IconButton, Segmented, Skeleton, TickerLogo, Tooltip } from '@/components/ui'
import { useStockSearch } from '@/hooks/useMarket'
import { useCreateWatchlist, useDeleteWatchlist, useUpdateWatchlist } from '@/hooks/useWatchlists'
import { qk } from '@/hooks/queryClient'
import { useHotkeys } from '@/hooks/useHotkeys'
import { useUI } from '@/store/ui'
import { formatChange, formatPrice } from '@/utils/format'
import { cn } from '@/utils/cn'
import { SelectionBar } from './SelectionBar'

const RANGES = [
  { value: '1D', label: '1N', field: 'changePct', text: 'trong ngày' },
  { value: '1W', label: '1T', field: 'perf1W', text: '1 tuần' },
  { value: '1M', label: '1TH', field: 'perf1M', text: '1 tháng' },
  { value: '3M', label: '3TH', field: 'perf3M', text: '3 tháng' },
  { value: '1Y', label: '1NĂM', field: 'perf1Y', text: '1 năm' },
]
const SORTS = [
  { id: 'manual', label: 'Thủ công', icon: ArrowUpDown },
  { id: 'change', label: '% thay đổi', icon: ArrowUpDown },
  { id: 'alpha', label: 'A → Z', icon: ArrowDownAZ },
]

const selKey = (listId, t) => `${listId}|${t}`

/** Quản lý các danh sách theo dõi: thêm mã, tạo/đổi tên/xoá danh sách, kéo thả sắp xếp, chọn nhiều. */
export function WatchlistManager({ lists, isLoading, byTicker }) {
  const qc = useQueryClient()
  const toast = useUI((s) => s.toast)
  const updateWl = useUpdateWatchlist()
  const createWl = useCreateWatchlist()
  const deleteWl = useDeleteWatchlist()

  const [range, setRange] = useState('1D')
  const [sort, setSort] = useState('manual')
  const [adding, setAdding] = useState(null) // id danh sách đang thêm mã
  const [creating, setCreating] = useState(null) // { moving?: string[] } khi đang tạo danh sách mới
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const [drag, setDrag] = useState(null) // { listId, ticker }
  const [order, setOrder] = useState({}) // listId → thứ tự tạm khi kéo

  const rangeMeta = RANGES.find((r) => r.value === range)
  const sortMeta = SORTS.find((s) => s.id === sort)

  useHotkeys({ Escape: () => selectMode && exitSelect() }, { enabled: selectMode })

  /** Lưu danh sách mã của 1 list (cập nhật cache ngay để không giật). */
  const saveTickers = (id, tickers, opts) => {
    qc.setQueryData(qk.watchlists, (prev) => prev?.map((l) => (l.id === id ? { ...l, tickers } : l)))
    return updateWl.mutateAsync({ id, tickers }, opts).catch(() => qc.invalidateQueries({ queryKey: qk.watchlists }))
  }

  const exitSelect = () => {
    setSelectMode(false)
    setSelected(new Set())
  }

  const displayTickers = (l) => {
    const base = order[l.id] ?? l.tickers
    if (sort === 'manual') return base
    const arr = base.filter((t) => byTicker.get(t))
    if (sort === 'alpha') return [...arr].sort((a, b) => a.localeCompare(b))
    return [...arr].sort((a, b) => (byTicker.get(b)[rangeMeta.field] ?? 0) - (byTicker.get(a)[rangeMeta.field] ?? 0))
  }

  /* ---- Kéo thả ---- */
  const canDrag = sort === 'manual' && !selectMode
  const onDragStart = (e, l, t) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', t)
    setDrag({ listId: l.id, ticker: t })
    setOrder((o) => ({ ...o, [l.id]: l.tickers }))
  }
  const onDragOver = (e, l, t) => {
    if (!drag || drag.listId !== l.id) return
    e.preventDefault()
    if (t === drag.ticker) return
    setOrder((o) => {
      const arr = [...(o[l.id] ?? l.tickers)]
      const from = arr.indexOf(drag.ticker)
      const to = arr.indexOf(t)
      if (from < 0 || to < 0) return o
      arr.splice(from, 1)
      arr.splice(to, 0, drag.ticker)
      return { ...o, [l.id]: arr }
    })
  }
  const commitOrder = (l) => {
    const arr = order[l.id]
    setDrag(null)
    setOrder((o) => {
      const n = { ...o }
      delete n[l.id]
      return n
    })
    if (arr && arr.join() !== l.tickers.join()) saveTickers(l.id, arr)
  }
  const moveByKey = (l, t, dir) => {
    const arr = [...l.tickers]
    const i = arr.indexOf(t)
    const j = i + dir
    if (i < 0 || j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    saveTickers(l.id, arr)
  }

  /* ---- Chọn nhiều ---- */
  const toggleSel = (listId, t) =>
    setSelected((s) => {
      const n = new Set(s)
      const k = selKey(listId, t)
      n.has(k) ? n.delete(k) : n.add(k)
      return n
    })
  const entries = [...selected].map((k) => {
    const [listId, ticker] = k.split('|')
    return { listId, ticker }
  })
  const removeEntries = async (items, exceptListId) => {
    const byList = {}
    items.forEach(({ listId, ticker }) => {
      if (listId === exceptListId) return
      ;(byList[listId] ??= new Set()).add(ticker)
    })
    await Promise.all(
      Object.entries(byList).map(([id, set]) => {
        const l = lists.find((x) => x.id === id)
        return l ? saveTickers(id, l.tickers.filter((t) => !set.has(t))) : null
      }),
    )
  }
  const moveTo = async (target) => {
    const tickers = [...new Set(entries.map((e) => e.ticker))]
    await saveTickers(target.id, [...new Set([...target.tickers, ...tickers])])
    await removeEntries(entries, target.id)
    toast(`Đã chuyển ${tickers.length} mã sang "${target.name}".`, 'success')
    exitSelect()
  }
  const removeSelected = async () => {
    const n = entries.length
    await removeEntries(entries)
    toast(`Đã gỡ ${n} mã khỏi danh sách.`, 'success')
    exitSelect()
  }
  const startMoveToNew = () => setCreating({ moving: entries })

  const createList = (name) => {
    const moving = creating?.moving
    const tickers = moving ? [...new Set(moving.map((e) => e.ticker))] : []
    createWl.mutate(
      { name, tickers },
      {
        onSuccess: async () => {
          if (moving) {
            await removeEntries(moving)
            exitSelect()
          }
          setCreating(null)
        },
      },
    )
  }

  const allEmpty = !lists?.length

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="wl-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <h2 id="wl-title" className="ds-h3">
            Danh sách của bạn
          </h2>
          <p className="text-xs text-muted">
            {lists?.length ?? 0} danh sách · sắp xếp: {sortMeta.label}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Tooltip label="Thêm mã" side="bottom">
            <IconButton size="sm" aria-label="Thêm mã" active={!!adding} disabled={allEmpty} className="disabled:pointer-events-none disabled:opacity-40" onClick={() => setAdding((a) => (a ? null : lists?.[0]?.id))}>
              <Plus className="size-4" />
            </IconButton>
          </Tooltip>
          <Tooltip label="Tạo danh sách mới" side="bottom">
            <IconButton size="sm" aria-label="Tạo danh sách mới" active={!!creating} onClick={() => setCreating((c) => (c ? null : {}))}>
              <ListPlus className="size-4" />
            </IconButton>
          </Tooltip>
          <Tooltip label={`Sắp xếp: ${sortMeta.label}`} side="bottom">
            <IconButton
              size="sm"
              aria-label={`Đổi cách sắp xếp (hiện tại: ${sortMeta.label})`}
              active={sort !== 'manual'}
              onClick={() => setSort((s) => SORTS[(SORTS.findIndex((x) => x.id === s) + 1) % SORTS.length].id)}
            >
              <sortMeta.icon className="size-4" />
            </IconButton>
          </Tooltip>
          <Tooltip label={selectMode ? 'Thoát chế độ chọn' : 'Chọn nhiều mã'} side="bottom">
            <IconButton size="sm" aria-label="Chọn nhiều mã" active={selectMode} disabled={allEmpty} className="disabled:pointer-events-none disabled:opacity-40" onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}>
              <CheckSquare className="size-4" />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <Segmented size="sm" options={RANGES} value={range} onChange={setRange} ariaLabel="Khung lợi nhuận" />
      </div>

      {creating && <CreateListInput moving={creating.moving?.length} pending={createWl.isPending} onCancel={() => setCreating(null)} onCreate={createList} />}

      {adding && lists?.length > 0 && (
        <AddTickerPanel lists={lists} listId={adding} onChangeList={setAdding} onDone={() => setAdding(null)} saveTickers={saveTickers} />
      )}

      <div className={cn('transition-[filter,opacity] duration-200', creating && 'pointer-events-none opacity-40 blur-[2px]')} aria-hidden={!!creating || undefined}>
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line px-3 pb-2 text-[11.5px] text-faint sm:grid-cols-[1fr_auto_auto]">
          <span>Mã</span>
          <span className="hidden text-right sm:block">Giá</span>
          <span className="w-[76px] text-right">Lợi nhuận {rangeMeta.text}</span>
        </div>

        {isLoading ? (
          <div className="space-y-2 pt-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : allEmpty ? (
          <EmptyState
            icon={Star}
            title="Bạn chưa có danh sách nào"
            description="Tạo danh sách để nhóm các cổ phiếu theo chiến lược của bạn: tăng trưởng, cổ tức, ngân hàng…"
            action={
              <Button variant="primary" size="sm" onClick={() => setCreating({})}>
                <ListPlus className="size-4" /> Tạo danh sách
              </Button>
            }
          />
        ) : (
          lists.map((l) => (
            <ListSection
              key={l.id}
              list={l}
              tickers={displayTickers(l)}
              byTicker={byTicker}
              field={rangeMeta.field}
              canDelete={lists.length > 1}
              onRename={(name) => updateWl.mutate({ id: l.id, name })}
              onDelete={() => deleteWl.mutate(l.id)}
              onAdd={() => setAdding(l.id)}
              selectMode={selectMode}
              isSelected={(t) => selected.has(selKey(l.id, t))}
              onToggleSel={(t) => toggleSel(l.id, t)}
              canDrag={canDrag}
              drag={drag}
              onDragStart={(e, t) => onDragStart(e, l, t)}
              onDragOver={(e, t) => onDragOver(e, l, t)}
              onDragEnd={() => commitOrder(l)}
              onMoveKey={(t, dir) => moveByKey(l, t, dir)}
            />
          ))
        )}
      </div>

      {canDrag && !allEmpty && <p className="mt-3 px-1 text-[11.5px] text-faint">Kéo thả để sắp xếp, hoặc chọn một dòng rồi nhấn Alt + ↑/↓.</p>}

      {selectMode && (
        <SelectionBar
          count={selected.size}
          tickers={[...new Set(entries.map((e) => e.ticker))]}
          lists={lists ?? []}
          onMove={moveTo}
          onMoveToNew={startMoveToNew}
          onDelete={removeSelected}
          onCancel={exitSelect}
        />
      )}
    </section>
  )
}

/* ---------------- Một danh sách ---------------- */

function ListSection({ list, tickers, byTicker, field, canDelete, onRename, onDelete, onAdd, selectMode, isSelected, onToggleSel, canDrag, drag, onDragStart, onDragOver, onDragEnd, onMoveKey }) {
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const inputRef = useRef(null)
  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const finishRename = (save) => {
    const v = inputRef.current?.value.trim()
    setEditing(false)
    if (save && v && v !== list.name) onRename(v)
  }

  return (
    <div className="pt-4">
      <div className="group/list flex min-h-8 items-center justify-between gap-2 px-3 pb-1">
        {editing ? (
          <input
            ref={inputRef}
            defaultValue={list.name}
            maxLength={40}
            aria-label="Tên danh sách"
            onBlur={() => finishRename(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') finishRename(true)
              if (e.key === 'Escape') {
                e.stopPropagation()
                finishRename(false)
              }
            }}
            className="h-8 flex-1 rounded-lg border border-brand/50 bg-base px-2 text-sm font-semibold outline-none"
          />
        ) : (
          <h3 className="min-w-0 cursor-text truncate text-[13px] font-semibold text-dim" onDoubleClick={() => setEditing(true)} title="Nhấp đúp để đổi tên">
            {list.name} <span className="font-normal text-faint">· {list.tickers.length}</span>
          </h3>
        )}
        {!editing &&
          (confirm ? (
            <span className="flex items-center gap-1.5 text-xs">
              <span className="text-muted">Xoá danh sách?</span>
              <button type="button" onClick={onDelete} className="rounded-md px-2 py-1 font-medium text-down hover:bg-down/10">
                Xoá
              </button>
              <button type="button" onClick={() => setConfirm(false)} className="rounded-md px-2 py-1 text-muted hover:bg-raised hover:text-fg">
                Huỷ
              </button>
            </span>
          ) : (
            canDelete && (
              <button
                type="button"
                onClick={() => setConfirm(true)}
                aria-label={`Xoá danh sách ${list.name}`}
                className="rounded-md p-1 text-faint opacity-0 transition-opacity group-hover/list:opacity-100 hover:text-down focus-visible:opacity-100"
              >
                <X className="size-4" />
              </button>
            )
          ))}
      </div>

      {tickers.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="mx-1 flex w-[calc(100%-8px)] items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong py-3.5 text-sm text-muted transition-colors hover:border-muted hover:text-fg"
        >
          <Plus className="size-4" /> Thêm mã
        </button>
      ) : (
        <ul>
          {tickers.map((t) => {
            const s = byTicker.get(t)
            if (!s) return null
            return (
              <WatchRow
                key={t}
                s={s}
                value={s[field]}
                selectMode={selectMode}
                checked={isSelected(t)}
                onToggle={() => onToggleSel(t)}
                draggable={canDrag}
                dragging={drag?.ticker === t && drag?.listId === list.id}
                onDragStart={(e) => onDragStart(e, t)}
                onDragOver={(e) => onDragOver(e, t)}
                onDragEnd={onDragEnd}
                onMoveKey={(dir) => onMoveKey(t, dir)}
              />
            )
          })}
        </ul>
      )}
    </div>
  )
}

function WatchRow({ s, value, selectMode, checked, onToggle, draggable, dragging, onDragStart, onDragOver, onDragEnd, onMoveKey }) {
  const body = (
    <>
      {selectMode ? (
        <Checkbox checked={checked} onChange={onToggle} label={`Chọn ${s.ticker}`} />
      ) : (
        draggable && <GripVertical className="size-4 shrink-0 cursor-grab text-faint opacity-0 transition-opacity group-hover/row:opacity-100" aria-hidden />
      )}
      <TickerLogo ticker={s.ticker} color={s.color} size={34} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-fg">{s.ticker}</span>
        <span className="block truncate text-xs text-muted">{s.name}</span>
      </span>
      <span className="hidden text-right sm:block">
        <span className="num block text-sm font-medium">{formatPrice(s.price)}</span>
        <span className={cn('num block text-[11px]', s.change > 0 ? 'text-up' : s.change < 0 ? 'text-down' : 'text-ref')}>{formatChange(s.change)}</span>
      </span>
      <span className="flex w-[76px] justify-end">
        <ChangePill value={value} />
      </span>
    </>
  )
  const cls = cn(
    'group/row flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all',
    dragging ? 'relative z-10 scale-[1.02] bg-overlay shadow-[0_18px_40px_-12px_rgb(0_0_0/0.9)] ring-1 ring-line-strong' : 'hover:bg-raised',
    selectMode && checked && 'bg-brand/[0.06]',
  )
  return (
    <li draggable={draggable} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={(e) => e.preventDefault()} onDragEnd={onDragEnd}>
      {selectMode ? (
        <button type="button" onClick={onToggle} className={cn(cls, 'w-full text-left')} aria-pressed={checked}>
          {body}
        </button>
      ) : (
        <Link
          to={`/app/co-phieu/${s.ticker}`}
          className={cls}
          draggable={false}
          onKeyDown={(e) => {
            if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && draggable) {
              e.preventDefault()
              onMoveKey(e.key === 'ArrowUp' ? -1 : 1)
            }
          }}
        >
          {body}
        </Link>
      )}
    </li>
  )
}

/* ---------------- Tạo danh sách ---------------- */

function CreateListInput({ moving, pending, onCancel, onCreate }) {
  const [name, setName] = useState('')
  return (
    <div className="relative z-10 mb-3 animate-slide-up rounded-2xl border border-brand/40 bg-raised p-3 shadow-2xl">
      <div className="flex items-center gap-2">
        <ListPlus className="size-4 shrink-0 text-brand" />
        <input
          autoFocus
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) onCreate(name.trim())
            if (e.key === 'Escape') {
              e.stopPropagation()
              onCancel()
            }
          }}
          placeholder="Tên danh sách mới — VD: Cổ tức đều"
          aria-label="Tên danh sách mới"
          className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
        />
        <button type="button" onClick={onCancel} className="rounded-lg px-2 py-1 text-xs text-muted hover:text-fg">
          Huỷ
        </button>
        <Button size="xs" variant="primary" disabled={!name.trim()} loading={pending} onClick={() => onCreate(name.trim())}>
          Tạo
        </Button>
      </div>
      {moving > 0 && <p className="mt-1 pl-6 text-xs text-muted">{moving} mã đã chọn sẽ được chuyển sang danh sách này.</p>}
    </div>
  )
}

/* ---------------- Thêm mã ---------------- */

function AddTickerPanel({ lists, listId, onChangeList, onDone, saveTickers }) {
  const [q, setQ] = useState('')
  const { data: results = [], isFetching } = useStockSearch(q.trim(), 8)
  const list = lists.find((l) => l.id === listId) ?? lists[0]

  const toggle = (t) => {
    const has = list.tickers.includes(t)
    saveTickers(list.id, has ? list.tickers.filter((x) => x !== t) : [...list.tickers, t])
  }

  return (
    <div className="mb-3 animate-slide-up rounded-2xl border border-line-strong bg-base p-3">
      <div className="flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-surface px-3 focus-within:border-brand/60">
        <Search className="size-4 shrink-0 text-muted" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              onDone()
            }
            if (e.key === 'Enter' && results[0]) toggle(results[0].ticker)
          }}
          placeholder="Tìm mã hoặc tên công ty…"
          aria-label="Tìm mã để thêm"
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
        />
        <button type="button" onClick={onDone} className="text-sm font-medium text-brand hover:underline">
          Xong
        </button>
      </div>
      {lists.length > 1 && (
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="shrink-0 text-xs text-faint">Thêm vào:</span>
          {lists.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={l.id === list.id}
              onClick={() => onChangeList(l.id)}
              className={cn('h-6 shrink-0 rounded-full border px-2.5 text-[11.5px]', l.id === list.id ? 'border-brand/50 bg-brand/10 text-brand' : 'border-line text-muted hover:text-fg')}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 text-[11px] text-faint">{q.trim() ? (isFetching ? 'Đang tìm…' : 'Kết quả') : 'Gợi ý — vốn hoá lớn nhất'}</div>
      <ul className="mt-1 max-h-72 overflow-y-auto">
        {results.map((s) => {
          const on = list.tickers.includes(s.ticker)
          return (
            <li key={s.ticker} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-raised">
              <TickerLogo ticker={s.ticker} color={s.color} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{s.ticker}</span>
                <span className="block truncate text-xs text-muted">{s.name}</span>
              </span>
              <button
                type="button"
                onClick={() => toggle(s.ticker)}
                aria-pressed={on}
                aria-label={on ? `Bỏ ${s.ticker} khỏi ${list.name}` : `Thêm ${s.ticker} vào ${list.name}`}
                className={cn('rounded-full p-2 transition-colors', on ? 'text-brand hover:bg-brand/10' : 'text-faint hover:bg-overlay hover:text-fg')}
              >
                <Star className="size-4" fill={on ? 'currentColor' : 'none'} />
              </button>
            </li>
          )
        })}
        {!isFetching && q.trim() && !results.length && <li className="px-2 py-6 text-center text-sm text-muted">Không tìm thấy mã phù hợp.</li>}
      </ul>
    </div>
  )
}

