import { useState } from 'react'
import { CreditCard, Crown, History, Sparkles } from 'lucide-react'
import { brand } from '@/config/brand'
import { Button, Card, Chip, ErrorState, Modal, RadioCard, Skeleton, TickMeter } from '@/components/ui'
import { useChangePlan, useResumeSubscription, useSubscription } from '@/hooks/useAccount'
import { useMe } from '@/hooks/useAuth'
import { useUI } from '@/store/ui'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import { SectionTitle } from './AccountCard'

const vnd = (v) => `${new Intl.NumberFormat('vi-VN').format(v)}đ`
const PERIOD_DAYS = { trial: brand.trialDays, monthly: 30, yearly: 365 }

function planInfo(sub) {
  if (sub.plan === 'trial') return { name: 'Dùng thử miễn phí', price: 0, period: `${brand.trialDays} ngày` }
  return brand.plans[sub.plan]
}

/** Thẻ gói thành viên: giá, trạng thái, thang ngày còn lại, đổi/huỷ gói. */
export function MembershipCard() {
  const { data: sub, isLoading, error, refetch } = useSubscription()
  const resume = useResumeSubscription()
  const [planOpen, setPlanOpen] = useState(false)

  if (error) return <Card className="p-6"><ErrorState error={error} onRetry={refetch} /></Card>
  if (isLoading || !sub) return <Skeleton className="h-[300px] rounded-[18px]" />

  const info = planInfo(sub)
  const canceled = sub.status === 'canceled'
  const trial = sub.status === 'trialing'
  const total = PERIOD_DAYS[sub.plan] ?? 30
  const left = Math.max(0, Math.ceil((sub.renewsAt - Date.now()) / 86400000))

  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div className={cn('pointer-events-none absolute -top-24 right-0 size-72 rounded-full blur-3xl', canceled ? 'bg-down/10' : 'bg-brand/12')} aria-hidden />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <SectionTitle icon={Crown} tone="bg-ref/14 text-ref" title="Gói thành viên" />
          <Chip tone={canceled ? 'down' : trial ? 'brand' : 'up'}>{canceled ? 'Đã huỷ gia hạn' : trial ? 'Đang dùng thử' : 'Đang hoạt động'}</Chip>
        </div>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="num text-[34px] leading-[1.25] font-bold tracking-tight">{info.price ? vnd(info.price) : 'Miễn phí'}</span>
          <span className="text-sm text-muted">/ {info.period}</span>
        </div>
        <div className="text-sm text-dim">{info.name}</div>

        <div className="mt-6">
          <TickMeter value={canceled ? -left : left} max={total} ticks={36} centered={false} className="h-6 w-full justify-between" />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[13px]">
            <span className={canceled ? 'text-down' : trial ? 'text-brand' : 'text-up'}>
              {canceled ? 'Gói kết thúc' : trial ? 'Hết hạn dùng thử' : 'Gia hạn tiếp theo'}: {formatDate(sub.renewsAt)}
            </span>
            <span className="text-muted">Còn {left} ngày</span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-[13px] text-muted">
          <Sparkles className="size-4" /> Thành viên từ {formatDate(sub.since, { month: 'long', year: 'numeric' })}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => setPlanOpen(true)}>
            {trial ? 'Chọn gói' : 'Đổi gói'}
          </Button>
          {canceled ? (
            <Button variant="secondary" size="sm" loading={resume.isPending} onClick={() => resume.mutate()}>
              Tiếp tục gói
            </Button>
          ) : (
            <Button variant="ghost" size="sm" to="/app/cai-dat/huy-goi">
              Huỷ gói
            </Button>
          )}
        </div>
      </div>
      <ChangePlanModal open={planOpen} onClose={() => setPlanOpen(false)} current={sub.plan} />
    </Card>
  )
}

function ChangePlanModal({ open, onClose, current }) {
  const [plan, setPlan] = useState(current === 'yearly' ? 'yearly' : 'monthly')
  const change = useChangePlan()
  return (
    <Modal open={open} onClose={onClose} title="Chọn gói thành viên" description="Thay đổi có hiệu lực ngay, phần chênh lệch được tính theo ngày." size="sm">
      <div role="radiogroup" className="space-y-3">
        {Object.values(brand.plans).map((p) => (
          <RadioCard key={p.id} checked={plan === p.id} onSelect={() => setPlan(p.id)}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="mt-0.5 text-[13px] text-muted">
                  <span className="mr-1.5 line-through">{vnd(p.compareAt)}</span>
                  <span className="num text-fg">{vnd(p.price)}</span> / {p.period}
                </div>
              </div>
              {p.save ? <Chip tone="up">Tiết kiệm {vnd(p.save)}</Chip> : current === p.id ? <Chip>Gói hiện tại</Chip> : null}
            </div>
          </RadioCard>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Để sau
        </Button>
        <Button variant="primary" loading={change.isPending} disabled={plan === current} onClick={() => change.mutate(plan, { onSuccess: onClose })}>
          Xác nhận
        </Button>
      </div>
    </Modal>
  )
}

/** Thẻ phương thức thanh toán (minh hoạ). */
export function PaymentCard() {
  const { data: me } = useMe()
  const toast = useUI((s) => s.toast)
  const holder = (me?.name ?? 'Khach hang')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
  return (
    <Card className="p-5 sm:p-6">
      <SectionTitle icon={CreditCard} tone="bg-info/14 text-info" title="Phương thức thanh toán" />
      <div className="relative mx-auto aspect-[1.586] w-full max-w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#2b2118_0%,#4a2e1d_45%,#1b1410_100%)] p-5 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.8)]">
        <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-brand/25 blur-2xl" aria-hidden />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="h-7 w-10 rounded-md bg-gradient-to-br from-[#f3d9a4] to-[#b88a3e] shadow-inner" aria-hidden />
            <span className="text-sm font-bold tracking-wide text-white/90 italic">VISA</span>
          </div>
          <div className="num font-mono text-lg tracking-[0.08em] text-white/90">•••• •••• •••• 4821</div>
          <div className="flex items-end justify-between text-[11px] text-white/60">
            <span className="truncate">{holder}</span>
            <span className="num">08/28</span>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-dim">Thẻ •••• 4821</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => toast('Lịch sử thanh toán đang được phát triển.', 'info')}>
            <History className="size-4" /> Lịch sử
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toast('Tính năng đang phát triển.', 'info')}>
            Cập nhật phương thức
          </Button>
        </div>
      </div>
    </Card>
  )
}
