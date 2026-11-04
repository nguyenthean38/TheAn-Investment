import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutTemplate, ListFilter, Plus, SearchX, X } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { Button, EmptyState, ErrorState, IconButton, Kbd, Skeleton, Tooltip } from '@/components/ui'
import { useStocks } from '@/hooks/useMarket'
import { useHotkeys, isTypingTarget } from '@/hooks/useHotkeys'
import { AddFilterPopover } from '@/components/screener/AddFilterPopover'
import { SaveTemplateModal, TemplatesPopover } from '@/components/screener/TemplatesPopover'
import { ScreenerTable } from '@/components/screener/ScreenerTable'
import { applyFilters, getDef, getOption, parseFilters, serializeFilters } from '@/components/screener/filters'

const DEFAULT_SORT = { key: 'marketCap', dir: 'desc' }
const TEXT_KEYS = new Set(['ticker', 'exchange', 'sectorName'])

function parseSort(str) {
  if (!str) return DEFAULT_SORT
  const [key, dir] = str.split('.')
  return { key, dir: dir === 'asc' ? 'asc' : 'desc' }
}

export default function ScreenerPage() {
  const { data: stocks, isLoading, error, refetch } = useStocks()
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params.get('f')), [params])
  const sort = useMemo(() => parseSort(params.get('sort')), [params])
  const [addOpen, setAddOpen] = useState(false)
  const [tplOpen, setTplOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)

  const update = (nextFilters, nextSort = sort) => {
    const p = new URLSearchParams(params)
    const f = serializeFilters(nextFilters)
    f ? p.set('f', f) : p.delete('f')
    nextSort.key === DEFAULT_SORT.key && nextSort.dir === DEFAULT_SORT.dir ? p.delete('sort') : p.set('sort', `${nextSort.key}.${nextSort.dir}`)
    setParams(p, { replace: true })
  }
  const addFilter = (f) => update([...filters.filter((x) => x.id !== f.id), f])
  const removeFilter = (id) => update(filters.filter((x) => x.id !== id))
  const clearAll = () => update([])
  const onSort = (key) => update(filters, sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: TEXT_KEYS.has(key) ? 'asc' : 'desc' })

  useHotkeys({ s: () => setAddOpen(true) })

  // Backspace: xoá bộ lọc cuối · Ctrl/⌘ + Backspace: xoá tất cả
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Backspace' || isTypingTarget(e.target) || document.querySelector('[aria-modal="true"]')) return
      if (!filters.length) return
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) clearAll()
      else removeFilter(filters[filters.length - 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const rows = useMemo(() => {
    if (!stocks) return []
    const list = applyFilters(stocks, filters)
    const m = sort.dir === 'asc' ? 1 : -1
    return [...list].sort((a, b) => {
      const va = a[sort.key]
      const vb = b[sort.key]
      if (TEXT_KEYS.has(sort.key)) return String(va).localeCompare(String(vb), 'vi') * m
      return ((va ?? -Infinity) - (vb ?? -Infinity)) * m
    })
  }, [stocks, filters, sort])

  return (
    <>
      <AppHeader
        title={
          <h1 className="flex items-center gap-2.5 text-[22px] leading-[1.35] font-bold tracking-tight">
            Bộ lọc cổ phiếu
            <span className="num rounded-full border border-line-strong bg-raised px-2 py-0.5 text-xs font-semibold text-dim">{stocks ? rows.length : '…'}</span>
          </h1>
        }
        subtitle="Sàng lọc theo định giá, tăng trưởng, cổ tức và hiệu suất giá"
      />

      <main className="container-app">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <span key={f.id} className="inline-flex h-8 items-stretch overflow-hidden rounded-full border border-line-strong bg-raised text-[13px]">
              <span className="flex items-center border-r border-line-strong px-3 text-muted">{getDef(f.id).label}</span>
              <span className="flex items-center pl-3 font-medium text-fg">{getOption(f).label}</span>
              <button type="button" onClick={() => removeFilter(f.id)} aria-label={`Bỏ lọc ${getDef(f.id).label}`} className="flex items-center px-2 text-muted hover:text-down">
                <X className="size-3.5" />
              </button>
            </span>
          ))}

          <div className="relative">
            <Button size="sm" variant={filters.length ? 'ghost' : 'secondary'} onClick={() => setAddOpen((v) => !v)} aria-expanded={addOpen}>
              <Plus className="size-4" /> {filters.length ? 'Thêm' : 'Thêm bộ lọc'}
              <Kbd className="ml-1">S</Kbd>
            </Button>
            <AddFilterPopover open={addOpen} onClose={() => setAddOpen(false)} filters={filters} onAdd={addFilter} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {filters.length > 0 && (
              <Tooltip label={<span className="flex items-center gap-1.5">Xoá tất cả <Kbd>Ctrl</Kbd><Kbd>⌫</Kbd></span>}>
                <IconButton aria-label="Xoá tất cả bộ lọc" onClick={clearAll}>
                  <ListFilter className="size-[18px]" />
                </IconButton>
              </Tooltip>
            )}
            <div className="relative">
              <Button size="sm" variant="secondary" onClick={() => setTplOpen((v) => !v)} aria-expanded={tplOpen}>
                <LayoutTemplate className="size-4" /> Mẫu bộ lọc
              </Button>
              <TemplatesPopover
                open={tplOpen}
                onClose={() => setTplOpen(false)}
                filters={filters}
                onApply={(t) => update(t.filters, t.sort ?? sort)}
                onSaveClick={() => setSaveOpen(true)}
              />
            </div>
          </div>
        </div>

        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="card space-y-3 p-4">
            {Array.from({ length: 10 }, (_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : rows.length ? (
          <ScreenerTable rows={rows} sort={sort} onSort={onSort} />
        ) : (
          <div className="card">
            <EmptyState
              icon={SearchX}
              title="Không có cổ phiếu phù hợp"
              description={
                <>
                  Thử nới lỏng tiêu chí: nhấn <Kbd>⌫</Kbd> để bỏ bộ lọc gần nhất, hoặc <Kbd>Ctrl</Kbd> + <Kbd>⌫</Kbd> để xoá tất cả.
                </>
              }
              action={
                <Button variant="primary" onClick={clearAll}>
                  Xoá tất cả bộ lọc
                </Button>
              }
            />
          </div>
        )}
        <p className="mt-3 text-[11.5px] text-faint">Chỉ số tài chính tính theo 4 quý gần nhất. Giá cập nhật theo phiên giao dịch gần nhất.</p>
      </main>

      <SaveTemplateModal open={saveOpen} onClose={() => setSaveOpen(false)} filters={filters} sort={sort} />
    </>
  )
}
