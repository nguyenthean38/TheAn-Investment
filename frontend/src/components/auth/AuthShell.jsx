import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui'
import { cn } from '@/utils/cn'

/** Khung chung cho trang đăng nhập / đăng ký: nền đen + quầng sáng, nội dung giữa màn hình. */
export function AuthShell({ children, footer, dim = false }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#060608]">
      <div className="pointer-events-none absolute top-[38%] left-1/2 size-[680px] max-w-[140vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(167_139_250/0.16),rgb(255_163_108/0.10)_45%,transparent_70%)] blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(45%_45%_at_50%_40%,black,transparent)]" aria-hidden />

      <header className="relative flex items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full py-1.5 pr-3 pl-2 text-sm text-muted transition-colors hover:bg-raised hover:text-fg">
          <ArrowLeft className="size-4" /> Trang chủ
        </Link>
        <Link to="/" aria-label="Nhịp — trang chủ" className={cn('transition-opacity', dim && 'opacity-30')}>
          <Logo size={26} />
        </Link>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-5 py-10">{children}</main>

      {footer && <footer className={cn('relative px-5 pb-8 text-center text-xs text-faint transition-opacity', dim && 'opacity-30')}>{footer}</footer>}
    </div>
  )
}

/** Biểu tượng Google đơn sắc (SVG, không dùng logo màu). */
export function GoogleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.64 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.7 14.55 2.75 12 2.75 6.89 2.75 2.75 6.89 2.75 12S6.89 21.25 12 21.25c6.93 0 9.2-4.86 9.2-7.36 0-.5-.05-.88-.12-1.26z"
      />
    </svg>
  )
}
