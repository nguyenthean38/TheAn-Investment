import { Fragment, useState } from 'react'
import { Maximize2, Sparkles } from 'lucide-react'
import { Button, ChangePill, ErrorState, Modal, Skeleton } from '@/components/ui'
import { useRecap } from '@/hooks/useMarket'
import { formatTime, formatValueVnd } from '@/utils/format'
import { cn } from '@/utils/cn'

/** Tô sáng số liệu và mã cổ phiếu trong đoạn văn tóm tắt. */
const TOKEN_RE = /(\b[A-Z]{3}\b|\d[\d.,]*(?:\s(?:điểm|mã|tỷ đồng))?%?)/g

export function Highlighted({ text, className }) {
  const parts = text.split(TOKEN_RE)
  return (
    <span className={className}>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} className="num text-brand-soft">
            {p}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </span>
  )
}

function RecapChip() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 py-1 pr-3 pl-2 text-xs font-medium text-brand">
      <Sparkles className="size-3.5" /> Bản tin Nhịp
    </span>
  )
}

/** Thẻ "Bản tin thị trường" — tóm tắt tự động, mở rộng thành modal chi tiết. */
export function RecapCard() {
  const { data, isLoading, error, refetch } = useRecap()
  const [open, setOpen] = useState(false)

  return (
    <section id="ban-tin" aria-labelledby="ban-tin-title" className="relative scroll-mt-6">
      {/* lớp thẻ xếp chồng phía sau */}
      <div className="absolute inset-x-6 -bottom-2 h-6 rounded-b-[18px] border border-line bg-surface/60" aria-hidden />
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-white/[0.07] bg-[#07070a] p-5 sm:p-7">
        <div className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-brand/15 blur-[90px]" aria-hidden />
        <div className="pointer-events-none absolute -right-20 -bottom-24 size-72 rounded-full bg-up/10 blur-[100px]" aria-hidden />
        <div className="relative flex items-center justify-between gap-3">
          <RecapChip />
          <div className="flex items-center gap-2 text-xs text-muted">
            {data && <span>Tổng hợp lúc {formatTime(data.generatedAt)}</span>}
            <button
              type="button"
              onClick={() => setOpen(true)}
              disabled={!data}
              aria-label="Mở bản tin đầy đủ"
              className="rounded-full p-1.5 text-muted transition-colors hover:bg-raised hover:text-fg disabled:opacity-40"
            >
              <Maximize2 className="size-4" />
            </button>
          </div>
        </div>
        <h2 id="ban-tin-title" className="sr-only">
          Bản tin thị trường
        </h2>
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="relative mt-5 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-11/12" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        ) : (
          <p className="relative mt-5 text-[19px] leading-[1.6] font-semibold text-fg/90 sm:text-[21px]">
            <Highlighted text={data.headline} />{' '}
            <button type="button" onClick={() => setOpen(true)} className="text-base font-medium text-dim underline decoration-faint underline-offset-4 hover:text-fg">
              Đọc thêm
            </button>
          </p>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} size="lg" title="Bản tin thị trường" description={data ? `Tổng hợp tự động lúc ${formatTime(data.generatedAt)} từ dữ liệu phiên gần nhất.` : undefined}>
        {data && (
          <div className="space-y-6">
            <p className="text-lg leading-[1.65] font-semibold">
              <Highlighted text={data.headline} />
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {data.highlights.map((h) => (
                <div key={h.label} className="rounded-2xl border border-line bg-base p-4">
                  <div className="ds-caption">{h.label}</div>
                  <div className="mt-1 font-semibold">{h.value}</div>
                  <div className="mt-1.5">
                    {h.changePct != null && <ChangePill value={h.changePct} size="sm" />}
                    {h.amount != null && <span className={cn('num text-sm font-medium', h.amount >= 0 ? 'text-up' : 'text-down')}>{formatValueVnd(Math.abs(h.amount))}</span>}
                  </div>
                </div>
              ))}
            </div>
            {data.sections.map((s) => (
              <div key={s.title}>
                <h3 className="ds-h3 mb-1.5">{s.title}</h3>
                <p className="text-[15px] leading-[1.7] text-dim">
                  <Highlighted text={s.body} />
                </p>
              </div>
            ))}
            <p className="flex items-center gap-2 border-t border-line pt-4 text-xs text-faint">
              <Sparkles className="size-3.5" /> Nội dung được tạo tự động, chỉ mang tính tham khảo.
            </p>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}
