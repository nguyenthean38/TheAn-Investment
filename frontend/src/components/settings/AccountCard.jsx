import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, BookOpen, Keyboard, LifeBuoy, LogOut, MessageSquare, SlidersHorizontal, UserRound } from 'lucide-react'
import { Button, Card, Input, Toggle } from '@/components/ui'
import { useLogout, useMe, usePreferences, useUpdateMe } from '@/hooks/useAuth'
import { useUI } from '@/store/ui'
import { cn } from '@/utils/cn'

/** Tiêu đề mục có ô icon tô màu. */
export function SectionTitle({ icon: Icon, tone, title, description }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', tone)}>
        <Icon className="size-[18px]" />
      </span>
      <div>
        <h2 className="ds-h3">{title}</h2>
        {description && <p className="text-[13px] text-muted">{description}</p>}
      </div>
    </div>
  )
}

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'

/** Thẻ trái: Tài khoản · Tuỳ chọn · Hỗ trợ · Đăng xuất. */
export function AccountCard() {
  const { data: me } = useMe()
  const prefs = usePreferences()
  const update = useUpdateMe()
  const logout = useLogout()
  const toast = useUI((s) => s.toast)
  const setShortcutsOpen = useUI((s) => s.setShortcutsOpen)
  const openPalette = useUI((s) => s.openPalette)
  const navigate = useNavigate()
  const [name, setName] = useState(me?.name ?? '')
  const [error, setError] = useState('')

  useEffect(() => setName(me?.name ?? ''), [me?.name])

  const saveName = () => {
    const v = name.trim()
    if (v === me?.name) return
    if (!v) {
      setError('Tên hiển thị không được để trống.')
      return
    }
    setError('')
    update.mutate(
      { name: v },
      {
        onSuccess: () => toast('Đã lưu tên hiển thị.', 'success'),
        onError: (e) => setError(e.fields?.name ?? e.message),
      },
    )
  }

  const setPref = (key, value, msg) =>
    update.mutate({ preferences: { [key]: value } }, { onSuccess: () => msg && toast(msg, 'success'), onError: (e) => toast(e.message, 'error') })

  const supportLinks = [
    { label: 'Bảng phím tắt', icon: Keyboard, run: () => setShortcutsOpen(true) },
    { label: 'Gửi góp ý cho đội ngũ', icon: MessageSquare, run: () => openPalette('feedback') },
    { label: 'Xem lại hướng dẫn sử dụng', icon: BookOpen, run: () => navigate('/bat-dau?xem-lai=1') },
  ]

  return (
    <Card className="divide-y divide-line">
      <section className="p-5 sm:p-6">
        <SectionTitle icon={UserRound} tone="bg-brand/14 text-brand" title="Tài khoản" description="Thông tin hiển thị trên Nhịp" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-soft via-brand to-brand-deep text-xl font-bold text-canvas">
            {initials(me?.name)}
          </span>
          <div className="grid flex-1 gap-4">
            <Input
              label="Tên hiển thị"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              error={error}
              hint="Nhấn Enter hoặc bấm ra ngoài để lưu."
            />
            <Input label="Email" value={me?.email ?? ''} readOnly disabled hint="Email dùng để đăng nhập, không thể thay đổi." />
          </div>
        </div>
      </section>

      <section className="p-5 sm:p-6">
        <SectionTitle icon={SlidersHorizontal} tone="bg-ceil/14 text-ceil" title="Tuỳ chọn" description="Cá nhân hoá trải nghiệm của bạn" />
        <div className="space-y-4">
          <Toggle label="Ẩn gợi ý phím tắt" description="Không hiện thông báo mẹo khi chuyển trang." checked={prefs.hideHints} onChange={(v) => setPref('hideHints', v)} />
          <Toggle
            label="Ẩn thanh điều hướng"
            description="Ẩn dock phía dưới, điều hướng bằng phím tắt và bảng lệnh."
            checked={prefs.hideDock}
            onChange={(v) => setPref('hideDock', v, v ? 'Đã ẩn thanh điều hướng. Nhấn Ctrl K để mở bảng lệnh.' : null)}
          />
          <Toggle label="Nhận bản tin tuần qua email" description="Tóm tắt thị trường và danh mục mỗi sáng thứ Hai." checked={prefs.newsletter} onChange={(v) => setPref('newsletter', v)} />
          <Toggle label="Hiển thị giá theo nghìn đồng" description="VD: 128,4 thay vì 128.400 — giống bảng điện." checked={prefs.priceUnit === 'k'} onChange={(v) => setPref('priceUnit', v ? 'k' : 'dong')} />
        </div>
      </section>

      <section className="p-5 sm:p-6">
        <SectionTitle icon={LifeBuoy} tone="bg-up/14 text-up" title="Hỗ trợ" />
        <ul className="-mx-2">
          {supportLinks.map((l) => (
            <li key={l.label}>
              <button type="button" onClick={l.run} className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm text-dim hover:bg-raised hover:text-fg">
                <l.icon className="size-4 text-muted" />
                {l.label}
                <ArrowUpRight className="ml-auto size-4 text-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fg" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <span className="text-sm text-muted">
          Đang đăng nhập với <span className="text-dim">{me?.email}</span>
        </span>
        <Button variant="danger" size="sm" loading={logout.isPending} onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/') })}>
          <LogOut className="size-4" /> Đăng xuất
        </Button>
      </section>
    </Card>
  )
}
