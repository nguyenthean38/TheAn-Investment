import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Fingerprint, Menu, X } from 'lucide-react'
import { Button, Logo } from '@/components/ui'
import { useMe } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

const LINKS = [
  { href: '#tinh-nang', label: 'Tính năng' },
  { href: '#bang-gia', label: 'Bảng giá' },
  { href: '#cap-nhat', label: 'Cập nhật', badge: 'Mới' },
  { href: '#hoi-dap', label: 'Hỏi đáp' },
]

/** Thanh điều hướng dính đầu trang của trang giới thiệu. */
export function MarketingNav() {
  const { data: me } = useMe()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn('sticky top-0 z-40 transition-colors duration-200', scrolled || open ? 'border-b border-line bg-canvas/80 backdrop-blur-xl' : 'border-b border-transparent')}>
      <nav aria-label="Điều hướng trang giới thiệu" className="container-app flex h-[68px] items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <Link to="/" aria-label="Nhịp — trang chủ">
            <Logo size={28} />
          </Link>
          <ul className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg">
                  {l.label}
                  {l.badge && <span className="rounded-full bg-up/12 px-1.5 py-px text-[10.5px] font-semibold text-up">{l.badge}</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          {me ? (
            <Button to="/app" variant="outline" size="md">
              Vào ứng dụng <ArrowRight className="size-4" />
            </Button>
          ) : (
            <>
              <Link to="/dang-nhap" className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm text-dim transition-colors hover:text-fg sm:inline-flex">
                <Fingerprint className="size-4" aria-hidden /> Đăng nhập
              </Link>
              <Button to="/dang-ky" variant="outline" size="md" className="hidden sm:inline-flex">
                Dùng thử miễn phí
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={open}
            className="flex size-10 items-center justify-center rounded-xl border border-line text-dim md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="container-app animate-fade-in pb-5 md:hidden">
          <ul className="flex flex-col gap-1 border-t border-line pt-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[15px] text-dim hover:bg-raised hover:text-fg">
                  {l.label}
                  {l.badge && <span className="rounded-full bg-up/12 px-1.5 py-px text-[10.5px] font-semibold text-up">{l.badge}</span>}
                </a>
              </li>
            ))}
          </ul>
          {!me && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button to="/dang-nhap" variant="secondary">
                Đăng nhập
              </Button>
              <Button to="/dang-ky" variant="primary">
                Dùng thử
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
