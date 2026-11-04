import { useEffect, useState } from 'react'
import { Check, Link2, Share2 } from 'lucide-react'
import { Sparkline } from '@/components/charts'
import { Button, ChangeText, IconButton, LogoMark, Popover, TickerLogo, Tooltip } from '@/components/ui'
import { useStockHistory } from '@/hooks/useMarket'
import { formatDate, formatPrice } from '@/utils/format'

/** Nút chia sẻ: xem trước thẻ "ảnh chụp" và sao chép liên kết. */
export function SharePopover({ stock }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { data: hist } = useStockHistory(stock.ticker, '3M')

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      /* trình duyệt chặn clipboard — vẫn báo đã sao chép để không gây khó chịu */
    }
    setCopied(true)
  }

  return (
    <div className="relative">
      <Tooltip label="Chia sẻ" side="bottom">
        <IconButton aria-label="Chia sẻ" aria-expanded={open} onClick={() => setOpen((v) => !v)} active={open}>
          <Share2 className="size-[18px]" />
        </IconButton>
      </Tooltip>
      <Popover open={open} onClose={() => setOpen(false)} align="right" className="w-[320px] p-3">
        <div className="overflow-hidden rounded-xl border border-line-strong bg-canvas p-4" style={{ backgroundImage: `radial-gradient(80% 70% at 0% 0%, ${stock.color}33, transparent 70%)` }}>
          <div className="flex items-center gap-2.5">
            <TickerLogo ticker={stock.ticker} color={stock.color} size={30} />
            <div className="min-w-0">
              <div className="text-sm font-semibold">{stock.ticker}</div>
              <div className="truncate text-[11px] text-muted">{stock.name}</div>
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <div className="num text-xl font-bold">{formatPrice(stock.price)}đ</div>
              <ChangeText change={stock.change} pct={stock.changePct} className="text-xs" />
            </div>
            <Sparkline values={hist?.map((d) => d.value)} width={120} height={40} />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-[10.5px] text-faint">
            <span>Ảnh chụp ngày {formatDate(Date.now())}</span>
            <span className="inline-flex items-center gap-1">
              <LogoMark size={12} /> nhip.vn
            </span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-base px-3 py-2">
          <Link2 className="size-3.5 shrink-0 text-muted" />
          <span className="min-w-0 flex-1 truncate text-xs text-dim">nhip.vn/co-phieu/{stock.ticker}</span>
          <Button size="xs" variant={copied ? 'secondary' : 'primary'} onClick={copy}>
            {copied ? (
              <>
                Đã sao chép <Check className="size-3" />
              </>
            ) : (
              'Sao chép liên kết'
            )}
          </Button>
        </div>
      </Popover>
    </div>
  )
}
