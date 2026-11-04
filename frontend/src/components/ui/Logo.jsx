import { useId } from 'react'
import { cn } from '@/utils/cn'

/** Biểu tượng "nhịp" — đường xung nhịp trong ô bo tròn. */
export function LogoMark({ size = 28, className }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={cn('shrink-0', className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd3ad" />
          <stop offset="0.55" stopColor="#ffa36c" />
          <stop offset="1" stopColor="#e9724c" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="#141418" stroke="rgb(255 255 255 / 0.08)" />
      <path d="M5 17h5l3-8 5 15 3-9 2 2h4" fill="none" stroke={`url(#${id})`} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Logo đầy đủ: biểu tượng + chữ "Nhịp". */
export function Logo({ size = 28, className, showText = true }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {showText && <span className="text-[19px] leading-[1.3] font-bold tracking-tight text-fg">Nhịp</span>}
    </span>
  )
}
