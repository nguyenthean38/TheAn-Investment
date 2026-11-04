import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, LogOut } from 'lucide-react'
import { brand } from '@/config/brand'
import { Splash } from '@/components/layout/AppLayout'
import { DockStep, DoneStep, InterestsStep, PaletteStep, WatchlistStep, WelcomeStep } from '@/components/onboarding/Steps'
import { useLogout, useMe, useUpdateMe } from '@/hooks/useAuth'
import { useCreateWatchlist, useUpdateWatchlist, useWatchlists } from '@/hooks/useWatchlists'
import { useUI } from '@/store/ui'
import { cn } from '@/utils/cn'

const STEPS = ['Chào mừng', 'Ngành quan tâm', 'Theo dõi', 'Bảng lệnh', 'Điều hướng', 'Hoàn tất']

/** Luồng làm quen sau khi đăng ký (route `/bat-dau`). `?xem-lai=1` để xem lại khi đã hoàn tất. */
export default function OnboardingPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const replay = params.get('xem-lai') === '1'
  const { data: me, isLoading } = useMe()
  const { data: lists } = useWatchlists()
  const updateMe = useUpdateMe()
  const updateList = useUpdateWatchlist()
  const createList = useCreateWatchlist()
  const logout = useLogout()
  const toast = useUI((s) => s.toast)

  const [step, setStep] = useState(0)
  const [interests, setInterests] = useState([])
  const [selected, setSelected] = useState([])
  const initRef = useRef({ interests: false, list: false })

  useEffect(() => {
    document.title = `Bắt đầu — ${brand.name}`
  }, [])

  // Khởi tạo từ dữ liệu sẵn có (một lần)
  useEffect(() => {
    if (me && !initRef.current.interests) {
      initRef.current.interests = true
      setInterests(me.interests ?? [])
    }
  }, [me])
  useEffect(() => {
    if (lists && !initRef.current.list) {
      initRef.current.list = true
      setSelected(lists[0]?.tickers ?? [])
    }
  }, [lists])

  // Cuộn lên đầu khi đổi bước
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  if (isLoading) return <Splash />
  if (!me) return <Navigate to="/dang-nhap?next=/bat-dau" replace />
  if (me.onboarded && !replay && !updateMe.isPending && !updateMe.isSuccess) return <Navigate to="/app" replace />

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  const toggleTicker = (t) => {
    const tickers = selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t]
    setSelected(tickers)
    const first = lists?.[0]
    if (first) updateList.mutate({ id: first.id, tickers })
    else if (!createList.isPending) createList.mutate({ name: 'Cổ phiếu theo dõi', tickers })
  }

  const finish = () =>
    updateMe.mutate(
      { onboarded: true, interests },
      {
        onSuccess: () => navigate('/app', { replace: true }),
        onError: (e) => toast(e.message, 'error'),
      },
    )

  const steps = [
    <WelcomeStep key="welcome" name={me.name} onNext={next} />,
    <InterestsStep key="interests" value={interests} onChange={setInterests} onNext={next} />,
    <WatchlistStep key="watch" interests={interests} selected={selected} onToggle={toggleTicker} saving={updateList.isPending || createList.isPending} onNext={next} />,
    <PaletteStep key="palette" onNext={next} />,
    <DockStep key="dock" onNext={next} />,
    <DoneStep key="done" interests={interests} watchCount={selected.length} onFinish={finish} finishing={updateMe.isPending} replay={replay} />,
  ]

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-[#07070a]">
      <div className="pointer-events-none fixed top-[30%] left-1/2 size-[760px] max-w-[150vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_163_108/0.12),rgb(167_139_250/0.08)_45%,transparent_70%)] blur-2xl" aria-hidden />

      <header className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-5 sm:px-8">
        <div className="min-w-0">
          {step > 0 ? (
            <button type="button" onClick={back} className="inline-flex items-center gap-2 rounded-full py-1.5 pr-3 pl-2 text-sm text-muted hover:bg-raised hover:text-fg">
              <ArrowLeft className="size-4" /> Quay lại
            </button>
          ) : (
            <button
              type="button"
              onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/', { replace: true }) })}
              className="inline-flex max-w-full items-center gap-2 rounded-full py-1.5 pr-3 pl-2 text-sm text-muted hover:bg-raised hover:text-fg"
            >
              <LogOut className="size-4 shrink-0" />
              <span className="truncate">
                Đăng xuất <span className="hidden text-faint sm:inline">({me.email})</span>
              </span>
            </button>
          )}
        </div>

        <ol className="flex items-center gap-1.5" aria-label={`Bước ${step + 1} trên ${STEPS.length}: ${STEPS[step]}`}>
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => setStep(i)}
                aria-label={label}
                aria-current={i === step ? 'step' : undefined}
                className={cn('block h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-brand' : i < step ? 'w-1.5 bg-dim hover:bg-fg' : 'w-1.5 bg-line-strong')}
              />
            </li>
          ))}
        </ol>

        <div className="flex justify-end">
          {step < STEPS.length - 1 && (
            <button type="button" onClick={finish} disabled={updateMe.isPending} className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-raised hover:text-fg">
              Bỏ qua
            </button>
          )}
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 pt-6 pb-16 sm:px-8">
        <div key={step} className="w-full max-w-5xl animate-slide-up">
          {steps[step]}
        </div>
      </main>
    </div>
  )
}
