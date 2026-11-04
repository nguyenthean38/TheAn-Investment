import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatChange, formatPercent, formatPrice, trend } from '@/utils/format'

/* ---------- Màu theo xu hướng ---------- */
export const TONE_TEXT = { up: 'text-up', down: 'text-down', ref: 'text-ref', ceil: 'text-ceil', floor: 'text-floor', neutral: 'text-dim' }
export const TONE_BG = {
  up: 'bg-up/12 text-up',
  down: 'bg-down/12 text-down',
  ref: 'bg-ref/12 text-ref',
  ceil: 'bg-ceil/14 text-ceil',
  floor: 'bg-floor/14 text-floor',
  neutral: 'bg-overlay text-dim',
  brand: 'bg-brand/12 text-brand',
  info: 'bg-info/12 text-info',
}

/** Màu giá theo quy ước bảng điện VN: trần (tím) / sàn (xanh lơ) / tham chiếu (vàng) / tăng / giảm. */
export function priceTone(price, { ref, ceil, floor } = {}) {
  if (price == null || ref == null) return 'neutral'
  if (ceil != null && price >= ceil) return 'ceil'
  if (floor != null && price <= floor) return 'floor'
  return trend(price - ref)
}

/** Phím tắt: <Kbd>Ctrl</Kbd> */
export function Kbd({ children, className }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line-strong bg-overlay px-1.5 font-mono text-[10.5px] font-medium text-dim shadow-[inset_0_-1px_0_rgb(0_0_0/0.4)]',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

/** Chuỗi phím "G rồi H" */
export function KeySeq({ keys, then = false, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] text-faint', className)}>
      {keys.map((k, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && then && <span>rồi</span>}
          <Kbd>{k}</Kbd>
        </span>
      ))}
    </span>
  )
}

/** Nhãn nhỏ. */
export function Chip({ tone = 'neutral', className, children, ...rest }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap', TONE_BG[tone], className)} {...rest}>
      {children}
    </span>
  )
}

/** Viên % thay đổi có nền màu. */
export function ChangePill({ value, className, size = 'md', digits = 2, tone }) {
  const t = tone ?? trend(value)
  return (
    <span
      className={cn(
        'num inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap',
        size === 'sm' ? 'h-5 px-1.5 text-[11px]' : 'h-6 min-w-[68px] px-2 text-xs',
        TONE_BG[t],
        className,
      )}
    >
      {formatPercent(value, { digits })}
    </span>
  )
}

/** Chữ thay đổi có màu: +1.200 (+0,95%) */
export function ChangeText({ change, pct, className, arrow = false, digits = 0 }) {
  const t = trend(pct ?? change)
  const Arrow = t === 'down' ? ArrowDownRight : ArrowUpRight
  return (
    <span className={cn('num inline-flex items-center gap-1 font-medium', TONE_TEXT[t], className)}>
      {arrow && t !== 'ref' && <Arrow className="size-3.5" aria-hidden />}
      {change != null && formatChange(change, digits)}
      {pct != null && <span>{change != null ? `(${formatPercent(pct)})` : formatPercent(pct)}</span>}
    </span>
  )
}

/** Giá có màu theo trần/sàn/tham chiếu. */
export function PriceText({ price, quote, className }) {
  return <span className={cn('num font-semibold', TONE_TEXT[priceTone(price, quote)], className)}>{formatPrice(price)}</span>
}

/** Logo mã cổ phiếu (ô vuông màu thương hiệu + chữ). */
export function TickerLogo({ ticker, color = '#444', size = 32, className }) {
  const label = ticker?.slice(0, 3) ?? '?'
  return (
    <span
      aria-hidden
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[30%] font-bold text-white', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * (label.length > 2 ? 0.3 : 0.36),
        background: `linear-gradient(145deg, ${color}, color-mix(in srgb, ${color} 55%, #000))`,
        boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.18)',
      }}
    >
      {label}
    </span>
  )
}

/** Dòng mã + tên, có link tới trang cổ phiếu. */
export function TickerCell({ ticker, name, color, sub, link = true, size = 32, className }) {
  const body = (
    <span className={cn('flex min-w-0 items-center gap-3', className)}>
      <TickerLogo ticker={ticker} color={color} size={size} />
      <span className="min-w-0">
        <span className="block font-semibold text-fg">{ticker}</span>
        <span className="block truncate text-xs text-muted">{sub ?? name}</span>
      </span>
    </span>
  )
  return link ? (
    <Link to={`/app/co-phieu/${ticker}`} className="min-w-0 rounded-lg hover:opacity-90">
      {body}
    </Link>
  ) : (
    body
  )
}

/** Thang vạch (tick meter) — vạch sáng từ giữa sang phải (tăng) hoặc trái (giảm). */
export function TickMeter({ value, max = 3, ticks = 24, className, centered = true }) {
  const t = trend(value)
  const ratio = Math.min(1, Math.abs(value ?? 0) / max)
  const lit = Math.max(value ? 1 : 0, Math.round(ratio * (centered ? ticks / 2 : ticks)))
  return (
    <span className={cn('inline-flex h-4 items-stretch gap-[2px]', className)} aria-hidden>
      {Array.from({ length: ticks }, (_, i) => {
        let on
        if (!centered) on = i < lit
        else if (t === 'up') on = i >= ticks / 2 && i < ticks / 2 + lit
        else on = i < ticks / 2 && i >= ticks / 2 - lit
        return <span key={i} className={cn('w-[2px] rounded-full', on ? (t === 'up' ? 'bg-up' : t === 'down' ? 'bg-down' : 'bg-ref') : 'bg-line-strong')} />
      })}
    </span>
  )
}

/** Thanh phân đoạn dạng viên thuốc (1N / 1T / 1TH…). */
export function Segmented({ options, value, onChange, size = 'md', className, ariaLabel }) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-line bg-base p-0.5 scrollbar-none', className)}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value
        const label = typeof o === 'string' ? o : o.label
        const active = v === value
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={cn(
              'num rounded-full font-medium whitespace-nowrap transition-colors',
              size === 'sm' ? 'h-6 px-2.5 text-[11.5px]' : 'h-8 px-3.5 text-[13px]',
              active ? 'bg-overlay text-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]' : 'text-muted hover:text-fg',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/** Tab gạch chân. */
export function Tabs({ options, value, onChange, className }) {
  return (
    <div role="tablist" className={cn('flex items-center gap-5 border-b border-line', className)}>
      {options.map((o) => {
        const active = o.value === value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              '-mb-px inline-flex items-center gap-2 border-b-2 pt-1 pb-3 text-sm font-medium transition-colors',
              active ? 'border-brand text-fg' : 'border-transparent text-muted hover:text-fg',
            )}
          >
            {Icon && <Icon className="size-4" aria-hidden />}
            {o.label}
            {o.badge != null && <span className="rounded-full bg-overlay px-1.5 text-[11px] text-dim">{o.badge}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** Thẻ nội dung. */
export function Card({ as: Tag = 'section', className, children, ...rest }) {
  return (
    <Tag className={cn('card', className)} {...rest}>
      {children}
    </Tag>
  )
}

/** Tiêu đề mục: "Khuyến nghị [A]" + mô tả + hành động bên phải. */
export function SectionHeader({ title, kbd, subtitle, tone, action, className, id }) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 id={id} className="ds-h2 flex items-center gap-2">
          {title}
          {kbd && <Kbd>{kbd}</Kbd>}
        </h2>
        {subtitle && <p className={cn('mt-0.5 text-sm', tone ? TONE_TEXT[tone] : 'text-muted')}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}

export function Spinner({ className }) {
  return <Loader2 className={cn('size-5 animate-spin text-muted', className)} aria-label="Đang tải" />
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full bg-brand/20 blur-2xl" />
          <div className="relative flex size-14 items-center justify-center rounded-2xl border border-line-strong bg-raised text-dim">
            <Icon className="size-6" />
          </div>
        </div>
      )}
      <h3 className="ds-h3">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry, className }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}>
      <AlertTriangle className="size-6 text-down" />
      <p className="text-sm text-dim">{error?.message ?? 'Không tải được dữ liệu.'}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-sm text-brand underline-offset-4 hover:underline">
          Thử lại
        </button>
      )}
    </div>
  )
}

/** Tooltip CSS đơn giản (hover/focus). `align`: center | start | end so với phần tử. */
export function Tooltip({ label, children, side = 'top', align = 'center', className }) {
  return (
    <span className={cn('group/tt relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 hidden rounded-lg border border-line-strong bg-canvas px-2.5 py-1.5 text-xs whitespace-nowrap text-fg shadow-xl group-focus-within/tt:block group-hover/tt:block',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          align === 'center' && 'left-1/2 -translate-x-1/2',
          align === 'start' && 'left-0',
          align === 'end' && 'right-0',
        )}
      >
        {label}
      </span>
    </span>
  )
}

/** Hàng nhãn – giá trị (bảng chỉ số). */
export function StatRow({ label, value, className }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0', className)}>
      <span className="text-muted">{label}</span>
      <span className="num text-right font-medium text-fg">{value}</span>
    </div>
  )
}

/** Ô chỉ số lớn (metrics strip). */
export function Metric({ label, value, sub, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="ds-caption truncate">{label}</div>
      <div className="num mt-1 truncate text-[15px] font-semibold text-fg">{value}</div>
      {sub && <div className="mt-0.5 truncate text-xs">{sub}</div>}
    </div>
  )
}

/** Huy hiệu sàn giao dịch. */
export function ExchangeBadge({ exchange, className }) {
  return <span className={cn('rounded-md border border-line-strong px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide text-muted', className)}>{exchange}</span>
}
