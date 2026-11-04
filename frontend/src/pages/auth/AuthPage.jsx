import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Check, Loader2, MailCheck, Sparkles, User } from 'lucide-react'
import { z } from 'zod'
import { authApi } from '@/api'
import { brand } from '@/config/brand'
import { Button } from '@/components/ui'
import { AuthShell, GoogleIcon } from '@/components/auth/AuthShell'
import { useLogin, useMe } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

const emailSchema = z.string().trim().min(1, 'Vui lòng nhập email.').email('Email chưa đúng định dạng, ví dụ: ten@email.com')
const GOOGLE_DEMO_EMAIL = 'nguoidung.google@gmail.com'

/** Chỉ cho phép chuyển hướng nội bộ (chống open redirect). */
function safeNext(next) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null
}

const COPY = {
  login: {
    title: 'Đăng nhập vào Nhịp',
    subtitle: 'Nhập email bạn đã dùng để đăng ký. Chúng tôi sẽ gửi một liên kết đăng nhập — không cần mật khẩu.',
    switchText: 'Chưa có tài khoản?',
    switchLink: 'Đăng ký miễn phí',
    switchTo: '/dang-ky',
    google: 'Đăng nhập bằng Google',
  },
  signup: {
    title: 'Chào mừng đến với Nhịp',
    subtitle: `Tạo tài khoản và dùng thử đầy đủ tính năng trong ${brand.trialDays} ngày. Không cần thẻ thanh toán.`,
    switchText: 'Đã có tài khoản?',
    switchLink: 'Đăng nhập',
    switchTo: '/dang-nhap',
    google: 'Đăng ký bằng Google',
  },
}

/** Trang đăng nhập / đăng ký bằng liên kết qua email (magic link). */
export default function AuthPage({ mode = 'login' }) {
  const copy = COPY[mode]
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const { data: me, isLoading: meLoading } = useMe()
  const login = useLogin()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState(null)
  const [focused, setFocused] = useState(false)
  const autoDemo = useRef(false)

  const send = useMutation({
    mutationFn: (addr) => authApi.requestMagicLink(addr),
    onSuccess: (d) => setSentTo(d.email),
    onError: (e) => setError(e.fields?.email ?? e.message),
  })

  const goAfterLogin = (user) => navigate(user.onboarded ? (next ?? '/app') : '/bat-dau', { replace: true })

  const loginDemo = () => login.mutate({ demo: true }, { onSuccess: ({ user }) => goAfterLogin(user), onError: (e) => setError(e.message) })

  // /dang-nhap?demo=1 → vào thẳng tài khoản demo
  useEffect(() => {
    if (params.get('demo') === '1' && !autoDemo.current && !meLoading && !me) {
      autoDemo.current = true
      loginDemo()
    }
  }, [params, meLoading, me]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = `${mode === 'login' ? 'Đăng nhập' : 'Đăng ký'} — ${brand.name}`
  }, [mode])

  // Đổi chế độ thì quay về form
  useEffect(() => {
    setSentTo(null)
    setError('')
  }, [mode])

  if (me && !login.isPending && !login.isSuccess) return <Navigate to={me.onboarded ? (next ?? '/app') : '/bat-dau'} replace />

  const submit = (e) => {
    e.preventDefault()
    const r = emailSchema.safeParse(email)
    if (!r.success) return setError(r.error.issues[0].message)
    setError('')
    send.mutate(r.data.toLowerCase())
  }

  const openLink = () => login.mutate({ email: sentTo, name: name.trim() || undefined }, { onSuccess: ({ user }) => goAfterLogin(user), onError: (e) => setError(e.message) })

  const typing = focused && email.length > 0
  const demoing = login.isPending && params.get('demo') === '1'

  return (
    <AuthShell
      dim={typing}
      footer={
        <>
          Khi tiếp tục, bạn đồng ý với <span className="text-dim underline decoration-faint underline-offset-2">Điều khoản sử dụng</span> và{' '}
          <span className="text-dim underline decoration-faint underline-offset-2">Chính sách bảo mật</span> của {brand.name}.
        </>
      }
    >
      <div className="w-full max-w-[440px] text-center">
        {sentTo ? (
          /* ---------- Đã gửi liên kết ---------- */
          <div className="animate-slide-up">
            <div className="relative mx-auto mb-7 inline-flex">
              <span className="absolute inset-0 rounded-full bg-up/25 blur-2xl" />
              <span className="relative flex size-16 items-center justify-center rounded-full border border-up/40 bg-up/10 text-up">
                <MailCheck className="size-7" />
              </span>
            </div>
            <h1 className="ds-h1 text-gradient sm:text-[32px]">Kiểm tra hộp thư</h1>
            <p className="mt-3 text-[15px] text-muted">Chúng tôi vừa gửi liên kết {mode === 'login' ? 'đăng nhập' : 'kích hoạt tài khoản'} tới</p>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-up/10 px-3 py-1 text-[15px] font-medium text-up">
              <Check className="size-4" /> {sentTo}
            </p>
            <p className="mt-4 text-[13px] text-faint">Liên kết có hiệu lực trong 15 phút. Hãy kiểm tra cả mục Thư rác nếu chưa thấy.</p>

            <div className="mt-8 rounded-2xl border border-dashed border-line-strong bg-surface/60 p-4">
              <p className="mb-3 text-xs text-muted">Bản trình diễn không gửi email thật — bấm nút dưới đây để mô phỏng việc mở liên kết.</p>
              <Button variant="primary" className="w-full" onClick={openLink} loading={login.isPending}>
                Mở liên kết {mode === 'login' ? 'đăng nhập' : 'kích hoạt'} (demo) <ArrowRight className="size-4" />
              </Button>
            </div>
            {error && <p className="mt-3 text-sm text-down">{error}</p>}

            <button type="button" onClick={() => setSentTo(null)} className="mt-6 text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
              Quay lại {mode === 'login' ? 'đăng nhập' : 'đăng ký'}
            </button>
          </div>
        ) : (
          /* ---------- Biểu mẫu ---------- */
          <div className="animate-slide-up">
            <h1 className={cn('ds-h1 text-gradient transition-opacity sm:text-[34px]', typing && 'opacity-40')}>{copy.title}</h1>
            <p className={cn('mx-auto mt-3 max-w-sm text-[15px] text-muted transition-opacity', typing && 'opacity-40')}>{copy.subtitle}</p>

            <form onSubmit={submit} noValidate className="mt-9 space-y-3 text-left">
              {mode === 'signup' && (
                <div className="flex h-[52px] items-center gap-3 rounded-full border border-line-strong bg-base/80 px-5 transition-colors focus-within:border-brand/60">
                  <User className="size-4 shrink-0 text-faint" aria-hidden />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tên của bạn (không bắt buộc)"
                    aria-label="Tên của bạn"
                    autoComplete="name"
                    maxLength={60}
                    className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
                  />
                </div>
              )}
              <div
                className={cn(
                  'flex h-[52px] items-center gap-2 rounded-full border bg-base/80 pr-1.5 pl-5 transition-colors focus-within:border-brand/60',
                  error ? 'border-down/60' : 'border-line-strong',
                )}
              >
                <label htmlFor="auth-email" className="sr-only">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Email của bạn"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'auth-email-err' : undefined}
                  className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
                />
                <button
                  type="submit"
                  disabled={send.isPending}
                  aria-label={mode === 'login' ? 'Gửi liên kết đăng nhập' : 'Tạo tài khoản'}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fg text-canvas transition-transform hover:scale-105 active:scale-95 disabled:opacity-70"
                >
                  {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                </button>
              </div>
              {error && (
                <p id="auth-email-err" role="alert" className="pl-5 text-[13px] text-down">
                  {error}
                </p>
              )}
            </form>

            <div className={cn('transition-opacity', typing && 'opacity-40')}>
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setEmail(GOOGLE_DEMO_EMAIL)
                  send.mutate(GOOGLE_DEMO_EMAIL)
                }}
                className="mt-5 inline-flex items-center gap-2 text-sm text-dim underline-offset-4 transition-colors hover:text-fg hover:underline"
              >
                <GoogleIcon className="size-4" /> {copy.google}
              </button>

              <div className="my-8 flex items-center gap-3 text-xs text-faint">
                <span className="h-px flex-1 bg-line" />
                hoặc
                <span className="h-px flex-1 bg-line" />
              </div>

              <button
                type="button"
                onClick={loginDemo}
                disabled={login.isPending}
                className={cn(
                  'group flex w-full items-center gap-4 rounded-2xl border bg-surface/70 p-4 text-left transition-colors hover:border-brand/50 disabled:opacity-70',
                  params.get('demo') === '1' ? 'border-brand/50' : 'border-line-strong',
                )}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-soft via-brand to-brand-deep text-canvas">
                  {demoing || (login.isPending && !sentTo) ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">Dùng tài khoản demo</span>
                  <span className="block text-[13px] text-muted">Vào ngay với danh mục và danh sách theo dõi mẫu</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
              </button>

              <p className="mt-8 text-sm text-muted">
                {copy.switchText}{' '}
                <Link to={copy.switchTo + (next ? `?next=${encodeURIComponent(next)}` : '')} className="font-medium text-fg underline decoration-faint underline-offset-4 hover:decoration-fg">
                  {copy.switchLink}
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </AuthShell>
  )
}
