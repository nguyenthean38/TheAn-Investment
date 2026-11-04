import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button, Chip, Textarea } from '@/components/ui'
import { useOverlayBehavior } from '@/components/ui/Overlay'
import { useCancelSubscription, useSubscription } from '@/hooks/useAccount'
import { useUI } from '@/store/ui'
import { cn } from '@/utils/cn'

const LOSSES = [
  { title: 'Bản tin sáng', body: 'Tóm tắt thị trường và danh mục trước giờ mở cửa mỗi ngày.' },
  { title: 'Dữ liệu phân tích doanh nghiệp', body: 'Báo cáo tài chính, khuyến nghị và so sánh cùng ngành.' },
  { title: 'Lịch sự kiện cá nhân hoá', body: 'Kết quả kinh doanh, cổ tức, ĐHCĐ của các mã bạn quan tâm.' },
  { title: 'Danh sách theo dõi đồng bộ', body: 'Danh sách và danh mục trên mọi thiết bị của bạn.' },
]
const REASONS = ['Chi phí cao so với nhu cầu', 'Tôi ít sử dụng', 'Thiếu tính năng tôi cần', 'Tôi chuyển sang công cụ khác', 'Lý do khác']

/** Trang xác nhận huỷ gói — bố cục tập trung toàn màn hình. */
export default function CancelMembershipPage() {
  const navigate = useNavigate()
  const { data: sub } = useSubscription()
  const cancel = useCancelSubscription()
  const toast = useUI((s) => s.toast)
  const [reason, setReason] = useState(null)
  const [note, setNote] = useState('')
  const back = () => navigate('/app/cai-dat')
  // aria-modal → các phím tắt toàn cục tạm tắt; Esc để quay lại
  const ref = useOverlayBehavior(true, back)

  const confirm = () => cancel.mutate(undefined, { onSuccess: () => navigate('/app/cai-dat', { replace: true }) })

  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Huỷ gói thành viên" tabIndex={-1} className="fixed inset-0 z-40 overflow-y-auto bg-canvas outline-none">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[480px] bg-[radial-gradient(50%_60%_at_50%_0%,rgb(255_90_106/0.14),transparent_70%)]" aria-hidden />
      <button type="button" onClick={back} aria-label="Đóng" className="fixed top-5 left-5 z-10 rounded-full border border-line-strong bg-raised p-2.5 text-muted transition-colors hover:text-fg">
        <X className="size-5" />
      </button>

      <main className="relative mx-auto flex min-h-full max-w-[620px] flex-col items-center px-5 pt-24 pb-16 text-center">
        <Chip>Thành viên từ {sub ? new Date(sub.since).getFullYear() : '…'}</Chip>
        <h1 className="mt-5 ds-h1 text-gradient sm:text-[40px] sm:leading-[1.25]">Bạn sắp rời Nhịp?</h1>
        <p className="mt-3 max-w-md text-[15px] text-muted">Khi gói hết hạn, tài khoản của bạn sẽ chuyển về chế độ chỉ xem. Bạn có thể quay lại bất cứ lúc nào.</p>

        <section className="card mt-10 w-full p-5 text-left sm:p-6">
          <h2 className="ds-h3">Những gì bạn sẽ mất</h2>
          <ul className="mt-4 space-y-3.5">
            {LOSSES.map((l) => (
              <li key={l.title} className="flex gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-down/14 text-down">
                  <X className="size-3" strokeWidth={3} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-fg">{l.title}</span>
                  <span className="block text-[13px] text-muted">{l.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card mt-4 w-full p-5 text-left sm:p-6">
          <h2 className="ds-h3">
            Điều gì khiến bạn muốn rời đi? <span className="text-sm font-normal text-muted">(không bắt buộc)</span>
          </h2>
          <div role="radiogroup" className="mt-4 flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={reason === r}
                onClick={() => setReason(reason === r ? null : r)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-[13px] transition-colors',
                  reason === r ? 'border-brand/70 bg-brand/10 text-fg' : 'border-line-strong text-dim hover:border-muted hover:text-fg',
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <Textarea className="mt-4" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Chia sẻ thêm để chúng tôi làm tốt hơn…" aria-label="Góp ý thêm" />
        </section>

        <div className="mt-8 flex w-full flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
          <button type="button" onClick={() => toast('Đã ghi nhận yêu cầu tạm dừng 1 tháng. Chúng tôi sẽ gửi email xác nhận.', 'success')} className="text-sm text-dim underline decoration-faint underline-offset-4 hover:text-fg">
            Tạm dừng 1 tháng
          </button>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="danger" onClick={confirm} loading={cancel.isPending} disabled={sub?.status === 'canceled'}>
              {sub?.status === 'canceled' ? 'Gói đã được huỷ' : 'Xác nhận huỷ'}
            </Button>
            <Button variant="primary" onClick={back}>
              Giữ gói thành viên
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
