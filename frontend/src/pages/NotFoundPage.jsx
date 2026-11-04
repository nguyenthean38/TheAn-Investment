import { useEffect } from 'react'
import { useRouteError } from 'react-router-dom'
import { Bug, Compass } from 'lucide-react'
import { brand } from '@/config/brand'
import { Button, Kbd } from '@/components/ui'

function Shell({ icon: Icon, tone, title, children, actions }) {
  return (
    <main className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(60%_50%_at_50%_45%,black,transparent)]" aria-hidden />
      <div className="pointer-events-none absolute top-1/3 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[120px]" aria-hidden />
      <div className={`relative mb-7 flex size-16 items-center justify-center rounded-full border ${tone}`}>
        <Icon className="size-7" />
      </div>
      <h1 className="relative ds-h1 text-gradient sm:text-4xl">{title}</h1>
      <div className="relative mt-3 max-w-md text-[15px] text-muted">{children}</div>
      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div>
    </main>
  )
}

/** Trang 404. */
export default function NotFoundPage({ inApp = false }) {
  return (
    <Shell icon={Compass} tone="border-line-strong bg-raised text-dim" title="Trang này đã lệch nhịp" actions={<Button to={inApp ? '/app' : '/'} variant="primary">{inApp ? 'Về Tổng quan' : 'Về trang chủ'}</Button>}>
      Đường dẫn bạn mở không tồn tại hoặc đã được di chuyển. Hãy thử tìm cổ phiếu bằng phím <Kbd>/</Kbd> sau khi vào ứng dụng.
    </Shell>
  )
}

/** Trang lỗi bất ngờ (errorElement của router). */
export function RouteErrorPage() {
  const error = useRouteError()
  useEffect(() => {
    console.error(error)
    const onKey = (e) => e.key === 'Enter' && window.location.reload()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [error])
  return (
    <div className="min-h-dvh bg-canvas">
      <Shell
        icon={Bug}
        tone="border-down/40 bg-down/10 text-down"
        title="Có gì đó vừa trục trặc"
        actions={
          <>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Tải lại trang
            </Button>
            <Button variant="ghost" href={`mailto:${brand.email}`}>
              Báo lỗi cho chúng tôi
            </Button>
          </>
        }
      >
        Nhịp gặp lỗi không mong muốn khi hiển thị trang này. Nhấn <Kbd>Enter</Kbd> để tải lại, hoặc gửi mô tả lỗi tới {brand.email}.
      </Shell>
    </div>
  )
}
