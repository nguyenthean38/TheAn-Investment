import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, CornerDownLeft, Keyboard, LayoutGrid, Loader2, MessageSquare, Search, Star } from 'lucide-react'
import { SECTORS } from '@/api/mock/seed/stocks'
import { DOCK_ITEMS } from '@/config/navigation'
import { Button, ChangePill, ExchangeBadge, Kbd, KeySeq, LogoMark, TickerLogo } from '@/components/ui'
import { TestimonialCard } from '@/components/marketing/Testimonials'
import { TESTIMONIALS } from '@/components/marketing/data'
import { useStockSearch, useStocks } from '@/hooks/useMarket'
import { isTypingTarget } from '@/hooks/useHotkeys'
import { formatPrice } from '@/utils/format'
import { cn } from '@/utils/cn'
import { KeyboardArt } from './KeyboardArt'

/** Tiêu đề bước: gradient + mô tả. */
export function StepTitle({ eyebrow, title, children }) {
  return (
    <div className="mx-auto max-w-xl text-center">
      {eyebrow && <div className="ds-label mb-3">{eyebrow}</div>}
      <h1 className="text-[28px] leading-[1.3] font-bold tracking-tight sm:text-[38px]">
        <span className="text-gradient">{title}</span>
      </h1>
      {children && <p className="mt-3 text-[15px] text-muted">{children}</p>}
    </div>
  )
}

/** Gợi ý phím Enter để tiếp tục. */
export function ContinueHint({ label = 'để tiếp tục', keyName = 'Enter' }) {
  return (
    <p className="mt-4 text-center text-[13px] text-faint">
      hoặc nhấn <Kbd>{keyName}</Kbd> {label}
    </p>
  )
}

/** Nghe Enter (hoặc phím khác) để chuyển bước — bỏ qua khi đang gõ. */
export function useContinueKey(onNext, { keys = ['Enter'], enabled = true } = {}) {
  const ref = useRef(onNext)
  useEffect(() => {
    ref.current = onNext
  })
  useEffect(() => {
    if (!enabled) return
    const h = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      if (e.target?.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return // để nút tự xử lý
      if (keys.includes(e.key)) {
        e.preventDefault()
        ref.current()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [enabled, keys.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps
}

/* =================== 1. Chào mừng =================== */
export function WelcomeStep({ name, onNext }) {
  useContinueKey(onNext, { keys: ['Enter', ' '] })
  const cards = [...TESTIMONIALS.slice(0, 4)]
  return (
    <div className="w-full">
      <StepTitle title={`Chào mừng ${name ?? 'bạn'} đến với Nhịp`}>
        Hàng nghìn nhà đầu tư dùng Nhịp mỗi sáng để bắt nhịp thị trường. Hãy cùng thiết lập không gian làm việc của riêng bạn.
      </StepTitle>
      <div className="relative mt-12 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_18%,black_82%,transparent)]">
        <div className="flex justify-center gap-4">
          {cards.map((t, i) => (
            <TestimonialCard key={t.name} t={t} className={cn(i === 0 || i === 3 ? 'opacity-50 blur-[1.5px]' : '')} />
          ))}
        </div>
      </div>
      <div className="mt-12 flex flex-col items-center">
        <Button variant="primary" size="lg" onClick={onNext} autoFocus>
          Thiết lập tài khoản <ArrowRight className="size-4" />
        </Button>
        <p className="mt-3 text-[13px] text-faint">Chỉ mất khoảng 1 phút</p>
      </div>
    </div>
  )
}

/* =================== 2. Ngành quan tâm =================== */
export function InterestsStep({ value, onChange, onNext }) {
  useContinueKey(onNext)
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  return (
    <div className="w-full">
      <StepTitle eyebrow="Bước 1 · Sở thích" title="Bạn quan tâm những ngành nào?">
        Chọn một vài ngành để Nhịp gợi ý cổ phiếu và ưu tiên tin tức phù hợp. Bạn có thể thay đổi sau trong Cài đặt.
      </StepTitle>
      <div role="group" aria-label="Ngành quan tâm" className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-2.5">
        {SECTORS.map((s) => {
          const on = value.includes(s.id)
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s.id)}
              className={cn(
                'inline-flex h-11 items-center gap-2 rounded-full border px-4.5 text-[14px] font-medium transition-all',
                on ? 'border-brand/70 bg-brand/12 text-brand-soft shadow-[0_0_0_4px_rgb(255_163_108/0.08)]' : 'border-line-strong bg-surface text-dim hover:border-muted hover:text-fg',
              )}
            >
              <span className={cn('flex size-4 items-center justify-center rounded-full border transition-colors', on ? 'border-brand bg-brand text-canvas' : 'border-line-strong')}>
                {on && <Check className="size-2.5" strokeWidth={3.5} />}
              </span>
              {s.name}
            </button>
          )
        })}
      </div>
      <div className="mt-12 flex flex-col items-center">
        <Button variant="primary" size="lg" onClick={onNext}>
          {value.length ? `Tiếp tục với ${value.length} ngành` : 'Bỏ qua bước này'} <ArrowRight className="size-4" />
        </Button>
        <ContinueHint />
      </div>
    </div>
  )
}

/* =================== 3. Danh sách theo dõi =================== */
export function WatchlistStep({ interests, selected, onToggle, saving, onNext }) {
  const [q, setQ] = useState('')
  const term = q.trim()
  const { data: results = [], isFetching } = useStockSearch(term, 10)
  const { data: all = [] } = useStocks()
  useContinueKey(onNext)

  const suggestions = useMemo(() => {
    const pool = interests.length ? all.filter((s) => interests.includes(s.sector)) : all
    return [...pool].sort((a, b) => b.marketCap - a.marketCap).slice(0, 8)
  }, [all, interests])
  const list = term ? results : suggestions

  return (
    <div className="w-full">
      <StepTitle eyebrow="Bước 2 · Theo dõi" title="Tìm những mã bạn quan tâm">
        Bấm ngôi sao để thêm cổ phiếu vào danh sách theo dõi đầu tiên của bạn.
      </StepTitle>

      <div className="mx-auto mt-9 max-w-xl overflow-hidden rounded-[22px] border border-line-strong bg-raised shadow-2xl">
        <div className="max-h-[340px] min-h-[200px] overflow-y-auto p-2">
          <div className="flex items-center justify-between px-3 pt-1 pb-2 text-[11.5px] text-faint">
            <span>{term ? 'Kết quả' : interests.length ? 'Gợi ý theo ngành bạn chọn' : 'Phổ biến'}</span>
            {(isFetching || saving) && <Loader2 className="size-3.5 animate-spin" />}
          </div>
          {list.map((s) => {
            const on = selected.includes(s.ticker)
            return (
              <div key={s.ticker} className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-overlay">
                <TickerLogo ticker={s.ticker} color={s.color} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {s.ticker} <ExchangeBadge exchange={s.exchange} />
                  </span>
                  <span className="block truncate text-xs text-muted">{s.name}</span>
                </span>
                <span className="hidden text-right sm:block">
                  <span className="num block text-[13px] text-dim">{formatPrice(s.price)}</span>
                </span>
                <ChangePill value={s.changePct} size="sm" className="hidden sm:inline-flex" />
                <button
                  type="button"
                  onClick={() => onToggle(s.ticker)}
                  aria-pressed={on}
                  aria-label={on ? `Bỏ theo dõi ${s.ticker}` : `Theo dõi ${s.ticker}`}
                  className={cn('flex size-9 items-center justify-center rounded-full transition-colors', on ? 'text-brand' : 'text-faint hover:bg-hover hover:text-fg')}
                >
                  <Star className={cn('size-[18px]', on && 'fill-current')} />
                </button>
              </div>
            )
          })}
          {term && !isFetching && !results.length && <p className="px-3 py-10 text-center text-sm text-muted">Không tìm thấy mã phù hợp với “{term}”.</p>}
        </div>
        <div className="flex h-12 items-center gap-2.5 border-t border-line bg-surface px-4">
          <Search className="size-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0] && term) onToggle(results[0].ticker)
            }}
            placeholder="Tìm mã hoặc tên công ty — VD: FPT, sữa…"
            aria-label="Tìm cổ phiếu"
            autoFocus
            className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
          />
        </div>
      </div>

      <div className="mt-6 flex min-h-8 flex-wrap justify-center gap-1.5">
        {selected.map((t) => (
          <button key={t} type="button" onClick={() => onToggle(t)} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-brand/12 px-2.5 text-xs font-semibold text-brand hover:bg-brand/20" aria-label={`Bỏ ${t}`}>
            <Star className="size-3 fill-current" /> {t}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center">
        <Button variant="primary" size="lg" onClick={onNext}>
          {selected.length ? `Tiếp tục với ${selected.length} mã` : 'Để sau'} <ArrowRight className="size-4" />
        </Button>
        <p className="mt-4 text-center text-[13px] text-faint">
          Nhấn <Kbd>Enter</Kbd> trong ô tìm kiếm để thêm kết quả đầu tiên
        </p>
      </div>
    </div>
  )
}

/* =================== 4. Bảng lệnh =================== */
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase().trim()

export function PaletteStep({ onNext }) {
  const [open, setOpen] = useState(false)
  const [pressed, setPressed] = useState([])
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  useEffect(() => {
    const down = (e) => {
      const mod = e.ctrlKey || e.metaKey
      setPressed([...(e.ctrlKey ? ['Ctrl'] : []), ...(e.metaKey ? ['⌘'] : []), ...(mod && e.key.toLowerCase() === 'k' ? ['K'] : [])])
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    const up = () => setPressed([])
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const items = [
    { id: 'go', label: 'Tiếp tục với Nhịp', icon: ArrowRight, group: 'Hướng dẫn', match: ['tiep tuc', 'continue'] },
    { id: 'search', label: 'Tìm cổ phiếu', icon: Search, group: 'Mọi thứ khác', kbd: '/' },
    { id: 'home', label: 'Tới Tổng quan', icon: LayoutGrid, group: 'Mọi thứ khác', keys: ['G', 'H'] },
    { id: 'keys', label: 'Bảng phím tắt', icon: Keyboard, group: 'Mọi thứ khác', kbd: '?' },
    { id: 'fb', label: 'Gửi góp ý', icon: MessageSquare, group: 'Mọi thứ khác' },
  ]
  const nq = norm(q)
  const visible = items.filter((i) => !nq || norm(i.label).includes(nq) || i.match?.some((m) => m.startsWith(nq) || nq.startsWith(m)))
  const safe = Math.min(active, Math.max(0, visible.length - 1))
  const [shake, setShake] = useState(false)

  const choose = (item) => {
    if (item?.id === 'go') return onNext()
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  return (
    <div className="w-full">
      <StepTitle eyebrow="Bước 3 · Bảng lệnh" title="Mọi thứ trong tầm phím">
        Bảng lệnh là trái tim của Nhịp. Nhấn <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd> + <Kbd>K</Kbd> ở bất kỳ đâu để tìm mã, mở báo cáo hay chuyển trang.
      </StepTitle>

      <div className="relative mt-10">
        <KeyboardArt lit={open ? [] : [isMac ? '⌘' : 'Ctrl', 'K']} pressed={pressed} className={cn('transition-all duration-500', open && 'scale-[0.97] opacity-25 blur-[2px]')} />

        {open && (
          <div className={cn('absolute inset-x-0 top-1/2 mx-auto w-[calc(100%-24px)] max-w-[520px] -translate-y-1/2 animate-pop overflow-hidden rounded-[20px] border border-line-strong bg-raised shadow-2xl', shake && 'animate-[pop_0.2s]')}>
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-overlay py-1 pr-3 pl-1.5 text-xs text-dim">
                <LogoMark size={16} /> Hướng dẫn
              </span>
              <span className="text-[11.5px] text-faint">
                Gõ “tiếp tục” rồi nhấn <Kbd>Enter</Kbd>
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto p-2" role="listbox">
              {['Hướng dẫn', 'Mọi thứ khác'].map((g) => {
                const groupItems = visible.filter((i) => i.group === g)
                if (!groupItems.length) return null
                return (
                  <div key={g}>
                    <div className="px-3 pt-1.5 pb-1 text-[11px] text-faint">{g}</div>
                    {groupItems.map((it) => {
                      const idx = visible.indexOf(it)
                      const Icon = it.icon
                      return (
                        <button
                          key={it.id}
                          type="button"
                          role="option"
                          aria-selected={idx === safe}
                          onMouseMove={() => setActive(idx)}
                          onClick={() => choose(it)}
                          className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm', idx === safe ? 'bg-hover' : 'hover:bg-overlay')}
                        >
                          <span className={cn('flex size-7 items-center justify-center rounded-lg border border-line-strong bg-overlay', it.id === 'go' ? 'text-brand' : 'text-dim')}>
                            <Icon className="size-3.5" />
                          </span>
                          <span className="flex-1">{it.label}</span>
                          {it.kbd && <Kbd>{it.kbd}</Kbd>}
                          {it.keys && <KeySeq keys={it.keys} then />}
                          {idx === safe && <CornerDownLeft className="size-3.5 text-faint" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
              {!visible.length && <p className="px-3 py-6 text-center text-sm text-muted">Không có lệnh phù hợp. Thử gõ “tiếp tục”.</p>}
            </div>
            <div className="flex h-11 items-center gap-2.5 border-t border-line bg-surface px-4">
              <Search className="size-4 text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setActive(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActive((i) => (i + 1) % Math.max(1, visible.length))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActive((i) => (i - 1 + visible.length) % Math.max(1, visible.length))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    choose(visible[safe])
                  } else if (e.key === 'Escape') {
                    setOpen(false)
                  }
                }}
                placeholder="Gõ một lệnh…"
                aria-label="Gõ lệnh"
                className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        {!open ? (
          <>
            <Button variant="secondary" size="lg" onClick={() => setOpen(true)}>
              Mở bảng lệnh thử
            </Button>
            <p className="text-[13px] text-faint">
              Thử nhấn <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd> + <Kbd>K</Kbd> ngay bây giờ
            </p>
          </>
        ) : (
          <button type="button" onClick={onNext} className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
            Bỏ qua phần thử
          </button>
        )}
      </div>
    </div>
  )
}

/* =================== 5. Thanh dock =================== */
export function DockStep({ onNext }) {
  const [hover, setHover] = useState(0)
  const [gPressed, setGPressed] = useState(false)
  const [done, setDone] = useState(false)
  const day = new Date().getDate()

  useEffect(() => {
    let timer
    const h = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      const k = e.key.toLowerCase()
      if (k === 'g') {
        setGPressed(true)
        clearTimeout(timer)
        timer = setTimeout(() => setGPressed(false), 1200)
        return
      }
      if (k === 'h' && gPressedRef.current) {
        e.preventDefault()
        setGPressed(false)
        setDone(true)
        setTimeout(onNextRef.current, 700)
      }
    }
    window.addEventListener('keydown', h)
    return () => {
      window.removeEventListener('keydown', h)
      clearTimeout(timer)
    }
  }, [])
  const gPressedRef = useRef(false)
  const onNextRef = useRef(onNext)
  useEffect(() => {
    gPressedRef.current = gPressed
    onNextRef.current = onNext
  })

  const item = DOCK_ITEMS[hover]
  return (
    <div className="w-full">
      <StepTitle eyebrow="Bước 4 · Điều hướng" title="Gợi ý ngay dưới con trỏ">
        Thanh dock ở cuối màn hình đưa bạn tới mọi trang. Di chuột lên từng biểu tượng để xem phím tắt tương ứng.
      </StepTitle>

      <div className="mt-16 flex flex-col items-center">
        <div className="relative">
          <div className="absolute bottom-full left-1/2 mb-4 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-line-strong bg-canvas px-3 py-2 text-xs whitespace-nowrap shadow-2xl">
            {item.label} <KeySeq keys={item.keys} then />
          </div>
          <div className="flex max-w-[calc(100vw-40px)] items-center gap-2">
            <div className="flex items-center gap-0.5 overflow-x-auto rounded-full border border-line-strong bg-raised/85 p-1.5 shadow-2xl scrollbar-none">
              {DOCK_ITEMS.map((d, i) => {
                const Icon = d.icon
                return (
                  <button
                    key={d.to}
                    type="button"
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    aria-label={d.label}
                    className={cn('relative flex size-10 shrink-0 items-center justify-center rounded-full transition-colors', hover === i ? 'bg-hover text-fg' : 'text-muted')}
                  >
                    {d.calendar ? (
                      <span className="flex size-[19px] flex-col overflow-hidden rounded-[5px] border-[1.6px] border-current">
                        <span className="h-[4px] bg-current" />
                        <span className="num flex flex-1 items-center justify-center text-[9px] font-bold">{day}</span>
                      </span>
                    ) : (
                      <Icon className="size-[19px]" />
                    )}
                    {i === 0 && <span className="absolute -bottom-0.5 h-[3px] w-3 rounded-full bg-brand" />}
                  </button>
                )
              })}
            </div>
            <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full border border-line-strong bg-raised/85 text-dim">
              <Search className="size-5" />
            </span>
          </div>
        </div>

        <div className={cn('mt-14 w-full max-w-md rounded-2xl border p-5 text-center transition-colors', done ? 'border-up/50 bg-up/8' : 'border-line-strong bg-surface')}>
          {done ? (
            <p className="flex items-center justify-center gap-2 text-[15px] font-medium text-up">
              <Check className="size-5" /> Tuyệt vời! Bạn đã thành thạo phím tắt đầu tiên.
            </p>
          ) : (
            <>
              <p className="text-[15px]">Thử ngay: để về Tổng quan, nhấn</p>
              <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted">
                <Kbd className={cn('h-8 min-w-8 text-sm transition-all', gPressed && 'border-brand bg-brand/20 text-brand-soft')}>G</Kbd>
                rồi
                <Kbd className="h-8 min-w-8 text-sm">H</Kbd>
              </p>
            </>
          )}
        </div>

        <Button variant="ghost" className="mt-8" onClick={onNext}>
          Tiếp tục <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

/* =================== 6. Hoàn tất =================== */
export function DoneStep({ interests, watchCount, onFinish, finishing, replay }) {
  useContinueKey(onFinish, { enabled: !finishing })
  const sectorNames = SECTORS.filter((s) => interests.includes(s.id)).map((s) => s.name)
  return (
    <div className="w-full text-center">
      <div className="relative mx-auto mb-8 inline-flex">
        <span className="absolute inset-0 rounded-3xl bg-brand/30 blur-2xl" />
        <LogoMark size={72} className="relative" />
      </div>
      <StepTitle title={replay ? 'Bạn đã xem lại hướng dẫn' : 'Mọi thứ đã sẵn sàng!'}>Không gian làm việc của bạn đã được thiết lập. Bản tin thị trường đầu tiên đang chờ ở trang Tổng quan.</StepTitle>

      <div className="mx-auto mt-10 grid grid-cols-1 max-w-lg gap-3 text-left sm:grid-cols-2">
        <div className="card p-4">
          <div className="ds-caption">Ngành quan tâm</div>
          <div className="mt-1 text-[15px] font-semibold">{sectorNames.length ? `${sectorNames.length} ngành` : 'Chưa chọn'}</div>
          {sectorNames.length > 0 && <div className="mt-1 line-clamp-2 text-xs text-muted">{sectorNames.join(', ')}</div>}
        </div>
        <div className="card p-4">
          <div className="ds-caption">Danh sách theo dõi</div>
          <div className="mt-1 text-[15px] font-semibold">{watchCount} mã cổ phiếu</div>
          <div className="mt-1 text-xs text-muted">Mở nhanh bất cứ lúc nào bằng phím W</div>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center">
        <Button variant="primary" size="lg" onClick={onFinish} loading={finishing}>
          Vào Nhịp <ArrowRight className="size-4" />
        </Button>
        <ContinueHint label="để bắt đầu" />
      </div>
    </div>
  )
}
