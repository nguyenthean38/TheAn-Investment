import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'
import { brand } from '@/config/brand'
import { Button, Kbd } from '@/components/ui'
import { useMe } from '@/hooks/useAuth'
import { useHotkeys } from '@/hooks/useHotkeys'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { ProductPreview } from '@/components/marketing/ProductPreview'
import { Features } from '@/components/marketing/Features'
import { Testimonials } from '@/components/marketing/Testimonials'
import { Faq, FinalCta, MarketingFooter, PartnerStrip, Pricing, Updates } from '@/components/marketing/Sections'
import { TourModal } from '@/components/marketing/TourModal'

/** Trang giới thiệu công khai (route `/`). */
export default function LandingPage() {
  const navigate = useNavigate()
  const { data: me } = useMe()
  const [tour, setTour] = useState(false)

  useEffect(() => {
    document.title = `${brand.name} — Nghiên cứu cổ phiếu thông minh`
  }, [])

  // Phím T ở bất kỳ đâu → bắt đầu dùng thử (hoặc vào ứng dụng nếu đã đăng nhập)
  useHotkeys({ t: () => navigate(me ? '/app' : '/dang-ky') })

  return (
    <div className="min-h-dvh overflow-x-clip bg-canvas">
      <MarketingNav />

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="pointer-events-none absolute inset-x-0 -top-[68px] h-[720px] bg-grid [mask-image:radial-gradient(55%_60%_at_50%_0%,black,transparent)]" aria-hidden />
          <div className="pointer-events-none absolute top-0 left-1/2 h-[520px] w-[900px] max-w-full -translate-x-1/2 glow-brand" aria-hidden />

          <div className="container-app relative flex flex-col items-center pt-16 text-center sm:pt-24">
            <button
              type="button"
              onClick={() => setTour(true)}
              className="group inline-flex items-center gap-2 rounded-full border border-line-strong bg-raised/70 py-1.5 pr-4 pl-1.5 text-[13px] text-dim backdrop-blur transition-colors hover:border-muted hover:text-fg"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-fg text-canvas">
                <Play className="size-3 fill-current" />
              </span>
              Xem nhanh trong 60 giây
            </button>

            <h1 className="ds-display mt-8 max-w-4xl">
              Đầu tư sáng suốt hơn, <span className="text-gradient">mỗi ngày.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] text-muted sm:text-[17px]">
              Nhịp gom bản tin thị trường, phân tích doanh nghiệp, lịch cổ tức và bộ lọc cổ phiếu Việt Nam vào một giao diện tối giản — thao tác nhanh như gõ phím.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              {me ? (
                <Button to="/app" variant="primary" size="lg">
                  Vào ứng dụng <ArrowRight className="size-4" />
                </Button>
              ) : (
                <>
                  <Button to="/dang-ky" variant="primary" size="lg">
                    Dùng thử {brand.trialDays} ngày miễn phí <ArrowRight className="size-4" />
                  </Button>
                  <Button to="/dang-nhap?demo=1" variant="secondary" size="lg">
                    Xem bản demo
                  </Button>
                </>
              )}
            </div>
            <p className="mt-5 text-[13px] text-faint">
              Nhấn <Kbd>T</Kbd> bất cứ lúc nào để {me ? 'vào ứng dụng' : 'bắt đầu dùng thử'}
            </p>
          </div>

          <div id="xem-truoc" className="container-app relative mt-16 sm:mt-20">
            <div className="mx-auto max-w-6xl [perspective:2000px]">
              <div className="origin-top transition-transform duration-700 lg:[transform:rotateX(8deg)] lg:hover:[transform:rotateX(0deg)]">
                <ProductPreview />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-canvas to-transparent" aria-hidden />
          </div>
        </section>

        <PartnerStrip />
        <Features />
        <Testimonials />
        <Pricing />
        <Updates />
        <Faq />
        <FinalCta />
      </main>

      <MarketingFooter />
      <TourModal open={tour} onClose={() => setTour(false)} />
    </div>
  )
}
