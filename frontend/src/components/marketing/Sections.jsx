import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, Gift } from 'lucide-react'
import { brand } from '@/config/brand'
import { Button, Kbd, Logo } from '@/components/ui'
import { formatNumber } from '@/utils/format'
import { cn } from '@/utils/cn'
import { FAQS, PARTNERS, UPDATES } from './data'

const vnd = (v) => `${formatNumber(v)}đ`

/* ---------- Dải đối tác ---------- */
export function PartnerStrip() {
  return (
    <section className="container-app py-14" aria-label="Đơn vị đồng hành">
      <p className="text-center text-[13px] text-faint">Dữ liệu khuyến nghị tổng hợp từ các đơn vị nghiên cứu đồng hành (tên minh hoạ)</p>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {PARTNERS.map((p) => (
          <li key={p} className="text-[15px] font-semibold tracking-tight text-faint/90 transition-colors hover:text-dim">
            {p}
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- Bảng giá ---------- */
const PLAN_FEATURES = [
  'Bản tin thị trường mỗi sáng và cuối phiên',
  'Báo cáo tài chính, khuyến nghị, giao dịch nội bộ',
  'Bộ lọc cổ phiếu và lưu mẫu không giới hạn',
  'Lịch sự kiện, cổ tức và cảnh báo danh mục',
  'Bảng lệnh và hệ thống phím tắt đầy đủ',
]

function PlanTicket({ plan, highlight, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'relative w-full overflow-hidden rounded-[24px] border text-left transition-all',
        selected ? 'border-brand/70 bg-brand/[0.05] shadow-[0_0_0_5px_rgb(255_163_108/0.08)]' : 'border-line-strong bg-surface hover:border-muted',
      )}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[15px] font-semibold">{plan.name}</span>
          {plan.save ? (
            <span className="rounded-full bg-up/12 px-2.5 py-1 text-[11.5px] font-semibold text-up">Tiết kiệm {vnd(plan.save)}</span>
          ) : (
            <span className={cn('flex size-5 items-center justify-center rounded-full border', selected ? 'border-brand bg-brand text-canvas' : 'border-line-strong')}>{selected && <Check className="size-3" strokeWidth={3} />}</span>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="num text-[34px] leading-[1.25] font-bold tracking-tight">{vnd(plan.price)}</span>
          <span className="text-sm text-muted">/ {plan.period}</span>
          <span className="num text-sm text-faint line-through">{vnd(plan.compareAt)}</span>
        </div>
        <p className="mt-2 text-[13px] text-muted">
          {plan.id === 'yearly' ? `Tương đương ${vnd(Math.round(plan.price / 12 / 1000) * 1000)} mỗi tháng, thanh toán một lần mỗi năm.` : 'Thanh toán hằng tháng, huỷ bất cứ lúc nào.'}
        </p>
      </div>
      {/* Đường răng cưa của vé */}
      <div className="relative h-0">
        <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full border border-line-strong bg-canvas" aria-hidden />
        <span className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full border border-line-strong bg-canvas" aria-hidden />
        <span className="absolute inset-x-6 top-0 border-t border-dashed border-line-strong" aria-hidden />
      </div>
      <ul className="space-y-2.5 p-6 pt-6 sm:p-7 sm:pt-6">
        {PLAN_FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-dim">
            <Check className={cn('mt-0.5 size-4 shrink-0', highlight ? 'text-brand' : 'text-up')} />
            {f}
          </li>
        ))}
      </ul>
    </button>
  )
}

export function Pricing() {
  const [plan, setPlan] = useState('yearly')
  const plans = [brand.plans.monthly, brand.plans.yearly]
  return (
    <section id="bang-gia" className="container-app scroll-mt-24 py-24 sm:py-32" aria-labelledby="bang-gia-title">
      <div className="mx-auto max-w-2xl text-center">
        <div className="ds-label">Bảng giá</div>
        <h2 id="bang-gia-title" className="mt-3 text-3xl leading-tight font-bold tracking-tight sm:text-[42px]">
          Một mức giá, <span className="text-gradient">đầy đủ tính năng</span>
        </h2>
        <p className="mt-4 text-[15px] text-muted">Dùng thử miễn phí {brand.trialDays} ngày, không cần thẻ thanh toán. Chọn gói phù hợp khi bạn đã sẵn sàng.</p>
      </div>
      <div role="radiogroup" aria-label="Chọn gói thành viên" className="mx-auto mt-14 grid grid-cols-1 max-w-4xl gap-5 md:grid-cols-2">
        {plans.map((p) => (
          <PlanTicket key={p.id} plan={p} highlight={p.id === 'yearly'} selected={plan === p.id} onSelect={() => setPlan(p.id)} />
        ))}
      </div>
      <div className="mt-10 flex flex-col items-center gap-3">
        <Button to={`/dang-ky?goi=${plan}`} variant="primary" size="lg">
          Bắt đầu {brand.trialDays} ngày dùng thử <ArrowRight className="size-4" />
        </Button>
        <span className="text-xs text-faint">Giá đã bao gồm VAT. Hoàn tiền trong 7 ngày nếu bạn không hài lòng.</span>
      </div>
    </section>
  )
}

/* ---------- Cập nhật ---------- */
export function Updates() {
  return (
    <section id="cap-nhat" className="container-app scroll-mt-24 py-20" aria-labelledby="cap-nhat-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="ds-label">Nhật ký cập nhật</div>
          <h2 id="cap-nhat-title" className="mt-2 text-[28px] leading-tight font-bold tracking-tight">Nhịp tốt hơn mỗi tuần</h2>
        </div>
        <p className="max-w-md text-sm text-muted">Chúng tôi phát hành tính năng mới liên tục dựa trên góp ý của chính người dùng.</p>
      </div>
      <ol className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {UPDATES.map((u) => (
          <li key={u.title} className="card relative p-6">
            <div className="flex items-center gap-2 text-xs">
              <span className={cn('rounded-full px-2 py-0.5 font-semibold', u.tag === 'Mới' ? 'bg-up/12 text-up' : 'bg-series-2/15 text-series-2')}>{u.tag}</span>
              <span className="text-faint">{u.date}</span>
            </div>
            <h3 className="mt-4 text-[16px] font-semibold">{u.title}</h3>
            <p className="mt-2 text-sm text-muted">{u.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ---------- Hỏi đáp ---------- */
export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="hoi-dap" className="container-app scroll-mt-24 py-24" aria-labelledby="hoi-dap-title">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <div className="ds-label">Hỏi đáp</div>
          <h2 id="hoi-dap-title" className="mt-3 text-3xl leading-tight font-bold tracking-tight sm:text-[38px]">
            Câu hỏi thường gặp
          </h2>
          <p className="mt-4 text-[15px] text-muted">
            Chưa thấy câu trả lời bạn cần? Viết cho chúng tôi tại{' '}
            <a href={`mailto:${brand.email}`} className="text-fg underline decoration-faint underline-offset-4 hover:decoration-fg">
              {brand.email}
            </a>
            .
          </p>
        </div>
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left text-[15.5px] font-medium transition-colors hover:text-brand-soft"
                  >
                    {f.q}
                    <ChevronDown className={cn('size-5 shrink-0 text-muted transition-transform', isOpen && 'rotate-180')} />
                  </button>
                </h3>
                <div id={`faq-${i}`} role="region" hidden={!isOpen} className="pr-10 pb-5 text-[14.5px] leading-relaxed text-muted">
                  {f.a}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- Kêu gọi cuối trang ---------- */
export function FinalCta() {
  return (
    <section className="container-app py-16">
      <div className="relative overflow-hidden rounded-[32px] border border-line-strong bg-surface px-6 py-16 text-center sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(70%_70%_at_50%_100%,black,transparent)]" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" aria-hidden />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-raised px-3 py-1 text-xs text-dim">
            <Gift className="size-3.5 text-brand" /> {brand.trialDays} ngày miễn phí, không cần thẻ
          </span>
          <h2 className="mx-auto mt-6 max-w-2xl text-3xl leading-tight font-bold tracking-tight sm:text-5xl sm:leading-[1.15]">
            Bắt nhịp thị trường <span className="text-gradient">ngay sáng mai</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-muted">Tạo tài khoản trong 30 giây. Bản tin đầu tiên sẽ chờ bạn trước giờ mở cửa.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button to="/dang-ky" variant="primary" size="lg">
              Dùng thử miễn phí <ArrowRight className="size-4" />
            </Button>
            <Button to="/dang-nhap?demo=1" variant="secondary" size="lg">
              Xem bản demo
            </Button>
          </div>
          <p className="mt-6 text-xs text-faint">
            Hoặc nhấn <Kbd>T</Kbd> ở bất kỳ đâu trên trang này
          </p>
        </div>
      </div>
    </section>
  )
}

/* ---------- Chân trang ---------- */
export function MarketingFooter() {
  const cols = [
    { title: 'Sản phẩm', links: [['Tính năng', '#tinh-nang'], ['Bảng giá', '#bang-gia'], ['Cập nhật', '#cap-nhat'], ['Hỏi đáp', '#hoi-dap']] },
    { title: 'Tài khoản', links: [['Đăng nhập', '/dang-nhap'], ['Đăng ký', '/dang-ky'], ['Tài khoản demo', '/dang-nhap?demo=1']] },
    { title: 'Liên hệ', links: [[brand.email, `mailto:${brand.email}`]] },
  ]
  return (
    <footer className="mt-10 border-t border-line">
      <div className="container-app grid grid-cols-1 gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">{brand.tagline}</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="ds-label">{c.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {c.links.map(([label, href]) => (
                <li key={label}>
                  {href.startsWith('/') ? (
                    <Link to={href} className="text-sm text-dim transition-colors hover:text-fg">
                      {label}
                    </Link>
                  ) : (
                    <a href={href} className="text-sm text-dim transition-colors hover:text-fg">
                      {label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-app flex flex-col gap-3 py-6 text-xs text-faint md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Nhịp. Bảo lưu mọi quyền.</span>
          <span className="max-w-2xl md:text-right">{brand.disclaimer}</span>
        </div>
      </div>
    </footer>
  )
}
