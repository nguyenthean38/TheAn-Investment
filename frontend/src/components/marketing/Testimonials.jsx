import { BadgeCheck } from 'lucide-react'
import { TESTIMONIALS } from './data'

const MARQUEE_CSS =
  '@keyframes nhip-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
  '.nhip-marquee{animation:nhip-marquee 60s linear infinite}' +
  '.group:hover .nhip-marquee{animation-play-state:paused}' +
  '@media (prefers-reduced-motion: reduce){.nhip-marquee{animation:none}}'

function initials(name) {
  const parts = name.split(' ')
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ name, color, size = 40 }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-canvas"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `linear-gradient(140deg, ${color}, color-mix(in srgb, ${color} 45%, #fff))` }}
    >
      {initials(name)}
    </span>
  )
}

export function TestimonialCard({ t, className = '' }) {
  return (
    <figure className={`card-glass flex w-[320px] shrink-0 flex-col gap-4 p-5 sm:w-[380px] ${className}`}>
      <figcaption className="flex items-center gap-3">
        <Avatar name={t.name} color={t.color} />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-[15px] font-semibold">
            {t.name} <BadgeCheck className="size-4 text-info" aria-label="Đã xác minh" />
          </span>
          <span className="block truncate text-xs text-muted">{t.role}</span>
        </span>
      </figcaption>
      <blockquote className="text-[14.5px] leading-relaxed text-dim">“{t.quote}”</blockquote>
    </figure>
  )
}

/** Băng chuyền lời chứng thực tự trôi, mờ dần ở hai mép. */
export function Testimonials({ title = true }) {
  const loop = [...TESTIMONIALS, ...TESTIMONIALS]
  return (
    <section className="py-20 sm:py-28" aria-labelledby="testimonials-title">
      <style>{MARQUEE_CSS}</style>
      {title && (
        <div className="container-app mb-12 text-center">
          <h2 id="testimonials-title" className="text-3xl leading-tight font-bold tracking-tight sm:text-[40px]">
            Được tin dùng bởi <span className="text-gradient">những nhà đầu tư chỉn chu</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted">Từ người mới bắt đầu đến chuyên viên phân tích — họ chọn Nhịp để tiết kiệm thời gian mỗi ngày.</p>
        </div>
      )}
      <div className="group relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="nhip-marquee flex w-max gap-4">
          {loop.map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}
