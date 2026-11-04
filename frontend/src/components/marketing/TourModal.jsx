import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, Command, ListFilter, Sparkles } from 'lucide-react'
import { Button, Kbd, Modal } from '@/components/ui'

const SLIDES = [
  { icon: Sparkles, title: 'Mở đầu ngày bằng bản tin thị trường', body: 'Mỗi sáng, Nhịp tóm tắt diễn biến VN-Index, nhóm ngành dẫn dắt và dòng tiền khối ngoại thành vài câu dễ đọc. Bạn biết ngay hôm nay cần chú ý điều gì.', hint: ['Trang Tổng quan', 'G H'] },
  { icon: Command, title: 'Điều khiển mọi thứ bằng bàn phím', body: 'Nhấn Ctrl K để mở bảng lệnh: tìm mã, mở báo cáo tài chính, xem khuyến nghị hay thêm vào danh sách theo dõi mà không cần chạm chuột.', hint: ['Bảng lệnh', 'Ctrl K'] },
  { icon: ListFilter, title: 'Lọc cổ phiếu theo tiêu chí của bạn', body: 'Kết hợp P/E, ROE, vốn hoá, hiệu suất giá… rồi lưu thành mẫu. Mỗi lần mở lại, kết quả được cập nhật theo dữ liệu mới nhất.', hint: ['Bộ lọc', 'G S'] },
  { icon: CalendarDays, title: 'Không bỏ lỡ sự kiện quan trọng', body: 'Lịch công bố KQKD, ĐHCĐ, ngày GDKHQ cổ tức và đáo hạn phái sinh — lọc riêng theo các mã bạn đang theo dõi.', hint: ['Lịch sự kiện', 'G C'] },
]
const DURATION = 15000

/** "Xem nhanh trong 60 giây": 4 trang giới thiệu tự chuyển, mỗi trang 15 giây. */
export function TourModal({ open, onClose }) {
  const [i, setI] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!open) return
    setI(0)
    setTick(0)
  }, [open])

  useEffect(() => {
    if (!open) return
    const start = Date.now()
    const id = setInterval(() => {
      const p = (Date.now() - start) / DURATION
      if (p >= 1) {
        clearInterval(id)
        setI((x) => (x + 1 < SLIDES.length ? x + 1 : x))
      }
      setTick(Math.min(1, p))
    }, 100)
    return () => clearInterval(id)
  }, [open, i])

  const s = SLIDES[i]
  const Icon = s.icon
  const last = i === SLIDES.length - 1
  return (
    <Modal open={open} onClose={onClose} size="md" hideClose={false}>
      <div className="flex gap-1.5" aria-hidden>
        {SLIDES.map((_, k) => (
          <button key={k} type="button" tabIndex={-1} onClick={() => setI(k)} className="h-1 flex-1 overflow-hidden rounded-full bg-overlay">
            <span className="block h-full bg-brand transition-[width] duration-100" style={{ width: k < i ? '100%' : k === i ? `${tick * 100}%` : 0 }} />
          </button>
        ))}
      </div>
      <div key={i} className="animate-slide-up pt-8 pb-2">
        <div className="relative mb-6 inline-flex">
          <span className="absolute inset-0 rounded-2xl bg-brand/30 blur-xl" />
          <span className="relative flex size-14 items-center justify-center rounded-2xl border border-line-strong bg-raised text-brand">
            <Icon className="size-6" />
          </span>
        </div>
        <p className="ds-caption">
          {i + 1} / {SLIDES.length}
        </p>
        <h2 className="mt-1 text-2xl leading-snug font-bold tracking-tight">{s.title}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{s.body}</p>
        <p className="mt-5 flex items-center gap-2 text-sm text-dim">
          {s.hint[0]}:
          {s.hint[1].split(' ').map((k) => (
            <Kbd key={k}>{k}</Kbd>
          ))}
        </p>
      </div>
      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>
          Quay lại
        </Button>
        {last ? (
          <Button to="/dang-ky" variant="primary" onClick={onClose}>
            Dùng thử miễn phí <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setI((x) => x + 1)}>
            Tiếp theo <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </Modal>
  )
}
