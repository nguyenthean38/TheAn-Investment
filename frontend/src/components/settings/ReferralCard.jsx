import { useId, useState } from 'react'
import { Gift, Link2, Send, X } from 'lucide-react'
import { brand } from '@/config/brand'
import { Button, Card, Skeleton } from '@/components/ui'
import { useReferrals, useSendReferrals } from '@/hooks/useAccount'
import { useUI } from '@/store/ui'
import { SectionTitle } from './AccountCard'

const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

/** Huy hiệu kim loại "N tháng miễn phí". */
function MetalBadge({ months }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 120 132" className="h-32 w-28 shrink-0 drop-shadow-[0_18px_30px_rgb(0_0_0/0.6)]" role="img" aria-label={`${months} tháng miễn phí`}>
      <defs>
        <linearGradient id={`${id}-m`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f6f8" />
          <stop offset="0.35" stopColor="#8d8d96" />
          <stop offset="0.55" stopColor="#e4e4ea" />
          <stop offset="0.8" stopColor="#6c6c75" />
          <stop offset="1" stopColor="#c9c9d0" />
        </linearGradient>
        <linearGradient id={`${id}-i`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2a31" />
          <stop offset="1" stopColor="#111115" />
        </linearGradient>
      </defs>
      <path d="M60 4 112 34v64L60 128 8 98V34Z" fill={`url(#${id}-m)`} />
      <path d="M60 14 103 39v54L60 118 17 93V39Z" fill={`url(#${id}-i)`} />
      <path d="M60 14 103 39v54L60 118 17 93V39Z" fill="none" stroke="rgb(255 255 255 / 0.12)" />
      <text x="60" y="70" textAnchor="middle" fill="#fff" fontSize="34" fontWeight="700">
        {months}
      </text>
      <text x="60" y="88" textAnchor="middle" fill="#a1a1aa" fontSize="8.5" fontWeight="600" letterSpacing="0.5">
        THÁNG
      </text>
      <text x="60" y="99" textAnchor="middle" fill="#a1a1aa" fontSize="8.5" fontWeight="600" letterSpacing="0.5">
        MIỄN PHÍ
      </text>
    </svg>
  )
}

/** Giới thiệu bạn bè: nhập nhiều email (Enter / dấu phẩy), gửi lời mời, sao chép liên kết. */
export function ReferralCard() {
  const { data, isLoading } = useReferrals()
  const send = useSendReferrals()
  const toast = useUI((s) => s.toast)
  const [emails, setEmails] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  const commit = (raw = draft) => {
    const parts = raw.split(/[,;\s]+/).map((x) => x.trim().toLowerCase()).filter(Boolean)
    if (!parts.length) return true
    const bad = parts.filter((p) => !isEmail(p))
    if (bad.length) {
      setError(`Email không hợp lệ: ${bad.join(', ')}`)
      return false
    }
    setEmails((list) => [...new Set([...list, ...parts])].slice(0, 10))
    setDraft('')
    setError('')
    return true
  }

  const onSend = () => {
    if (!commit()) return
    const list = [...new Set([...emails, ...draft.split(/[,;\s]+/).filter(isEmail)])]
    if (!list.length) return setError('Nhập ít nhất một email để gửi lời mời.')
    send.mutate(list, {
      onSuccess: () => {
        setEmails([])
        setDraft('')
      },
      onError: (e) => setError(e.message),
    })
  }

  const link = data ? `https://${brand.domain}/moi/${data.code}` : ''
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast('Đã sao chép liên kết giới thiệu.', 'success')
    } catch {
      toast(link, 'info')
    }
  }

  return (
    <Card id="gioi-thieu" className="scroll-mt-6 overflow-hidden">
      <div className="relative p-5 sm:p-6">
        <div className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-ceil/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <SectionTitle icon={Gift} tone="bg-down/14 text-[#f472b6]" title="Giới thiệu bạn bè, nhận tháng miễn phí" description="Mỗi người bạn tham gia, cả hai cùng nhận thêm 1 tháng sử dụng." />

            <div
              className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-line-strong bg-base px-2 py-1.5 focus-within:border-brand/60"
              onClick={(e) => e.currentTarget.querySelector('input')?.focus()}
            >
              {emails.map((e) => (
                <span key={e} className="inline-flex h-7 items-center gap-1 rounded-full bg-overlay pr-1 pl-2.5 text-xs text-dim">
                  {e}
                  <button type="button" onClick={() => setEmails((l) => l.filter((x) => x !== e))} aria-label={`Bỏ ${e}`} className="rounded-full p-0.5 hover:bg-hover hover:text-fg">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                value={draft}
                onChange={(e) => {
                  const v = e.target.value
                  if (/[,;]$/.test(v)) commit(v)
                  else setDraft(v)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    draft.trim() ? commit() : onSend()
                  } else if (e.key === 'Backspace' && !draft && emails.length) {
                    setEmails((l) => l.slice(0, -1))
                  }
                }}
                onBlur={() => draft && commit()}
                placeholder={emails.length ? '' : 'email@banbe.vn, email2@…'}
                aria-label="Email người được giới thiệu"
                className="h-8 min-w-[160px] flex-1 bg-transparent px-1.5 text-sm outline-none placeholder:text-faint"
              />
            </div>
            <p className={error ? 'mt-1.5 text-xs text-down' : 'ds-caption mt-1.5'}>{error || 'Nhập nhiều email, ngăn cách bằng dấu phẩy hoặc Enter.'}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="primary" size="sm" onClick={onSend} loading={send.isPending}>
                <Send className="size-3.5" /> Gửi lời mời
              </Button>
              <Button variant="secondary" size="sm" onClick={copy} disabled={!data}>
                <Link2 className="size-3.5" /> Sao chép liên kết
              </Button>
              <span className="ml-auto text-xs text-muted">
                {isLoading ? <Skeleton className="h-4 w-24" /> : `${data?.list.length ?? 0} lời mời đã gửi`}
              </span>
            </div>
            {data && (
              <p className="mt-3 truncate text-xs text-faint">
                Mã của bạn: <span className="font-mono text-dim">{data.code}</span>
              </p>
            )}
          </div>
          <div className="flex justify-center">
            <MetalBadge months={data?.freeMonths ?? 0} />
          </div>
        </div>
      </div>
    </Card>
  )
}
