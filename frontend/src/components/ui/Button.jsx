import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const VARIANTS = {
  /** Nút chính: viên thuốc trắng (CTA). */
  primary: 'bg-fg text-canvas hover:bg-white shadow-[0_8px_30px_-12px_rgb(255_255_255/0.45)]',
  /** Nút thương hiệu: gradient bình minh. */
  brand: 'bg-gradient-to-r from-brand-soft via-brand to-brand-deep text-canvas hover:brightness-110',
  /** Nút phụ: nền nổi + viền mảnh. */
  secondary: 'bg-raised text-fg border border-line-strong hover:bg-hover',
  outline: 'border border-line-strong text-fg hover:bg-raised',
  ghost: 'text-dim hover:text-fg hover:bg-raised',
  danger: 'border border-down/40 bg-down/10 text-down hover:bg-down/20',
  link: 'text-fg underline underline-offset-4 decoration-faint hover:decoration-fg px-0',
}

const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2.5',
}

const ICON_SIZES = { xs: 'size-7', sm: 'size-8', md: 'size-10', lg: 'size-12' }

/**
 * Nút chuẩn. Truyền `to` để render <Link>, `href` để render <a>.
 * `icon`: chỉ hiển thị icon (bắt buộc `aria-label`).
 */
export const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', icon = false, loading = false, disabled, to, href, className, children, type = 'button', ...rest },
  ref,
) {
  const cls = cn(
    'inline-flex shrink-0 items-center justify-center rounded-full font-medium whitespace-nowrap transition-all duration-150 select-none',
    'disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]',
    VARIANTS[variant],
    icon ? cn(ICON_SIZES[size], 'p-0') : SIZES[size],
    variant === 'link' && 'h-auto',
    className,
  )
  const content = (
    <>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </>
  )
  if (to) {
    return (
      <Link ref={ref} to={to} className={cls} {...rest}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={cls} {...rest}>
        {content}
      </a>
    )
  }
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={cls} {...rest}>
      {content}
    </button>
  )
})

/** Nút icon vuông bo góc (header, toolbar). */
export const IconButton = forwardRef(function IconButton({ className, active, size = 'md', children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl border border-line text-dim transition-colors hover:border-line-strong hover:bg-raised hover:text-fg',
        size === 'sm' ? 'size-8' : 'size-10',
        active && 'border-brand/40 bg-brand/10 text-brand hover:text-brand',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
