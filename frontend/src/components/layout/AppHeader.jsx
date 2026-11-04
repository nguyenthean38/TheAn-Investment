import { Link } from 'react-router-dom'
import { ArrowLeft, Moon, Search, Star, Sun } from 'lucide-react'
import { IconButton, LogoMark, Tooltip, Kbd } from '@/components/ui'
import { useOverview } from '@/hooks/useMarket'
import { useUI } from '@/store/ui'
import { formatPoint, formatPercent } from '@/utils/format'
import { cn } from '@/utils/cn'

/** Chỉ báo trạng thái phiên giao dịch + VN-Index. */
export function MarketStatus({ className }) {
  const { data } = useOverview()
  if (!data) return <span className={cn('skeleton h-5 w-48', className)} />
  const vn = data.indices.find((i) => i.code === 'VNINDEX')
  const open = data.session.open
  const Icon = open ? Sun : Moon
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-[13px] text-muted', className)}>
      <span className="hidden items-center gap-1.5 md:inline-flex">
        <span className={cn('size-1.5 rounded-full', open ? 'animate-pulse bg-up' : 'bg-faint')} />
        Thị trường <span className="text-fg">{data.session.label.toLowerCase()}</span>
      </span>
      <span className="num hidden text-dim lg:inline">
        VN-Index {formatPoint(vn.value)} <span className={vn.change >= 0 ? 'text-up' : 'text-down'}>{formatPercent(vn.changePct)}</span>
      </span>
      <Icon className="size-4" aria-hidden />
    </span>
  )
}

/**
 * Đầu trang ứng dụng: logo + tiêu đề (hoặc nút quay lại) bên trái, trạng thái thị trường + nút nhanh bên phải.
 * `actions`: nút riêng của trang (chèn trước nhóm nút chung).
 */
export function AppHeader({ title, subtitle, back, actions, showStatus = true, className }) {
  const openPalette = useUI((s) => s.openPalette)
  const setWatchPanelOpen = useUI((s) => s.setWatchPanelOpen)
  return (
    <header className={cn('container-app flex min-h-20 flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-6 pb-4', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {back ? (
          <Link to={back} aria-label="Quay lại" className="flex size-10 items-center justify-center rounded-xl border border-line text-dim transition-colors hover:bg-raised hover:text-fg">
            <ArrowLeft className="size-[18px]" />
          </Link>
        ) : (
          <Link to="/app" aria-label="Nhịp — Tổng quan">
            <LogoMark size={30} />
          </Link>
        )}
        <div className="min-w-0">
          {typeof title === 'string' ? <h1 className="truncate text-[22px] leading-[1.35] font-bold tracking-tight">{title}</h1> : title}
          {subtitle && <p className="truncate text-[13px] text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showStatus && <MarketStatus className="mr-2" />}
        {actions}
        <Tooltip label={<span className="flex items-center gap-2">Danh sách theo dõi <Kbd>W</Kbd></span>} side="bottom" align="end">
          <IconButton aria-label="Danh sách theo dõi" onClick={() => setWatchPanelOpen(true)}>
            <Star className="size-[18px]" />
          </IconButton>
        </Tooltip>
        <Tooltip label={<span className="flex items-center gap-2">Bảng lệnh <Kbd>Ctrl K</Kbd></span>} side="bottom" align="end">
          <IconButton aria-label="Mở bảng lệnh" onClick={() => openPalette('root')}>
            <Search className="size-[18px]" />
          </IconButton>
        </Tooltip>
      </div>
    </header>
  )
}
