import { useEffect, useMemo, useState } from 'react'
import { BarChart3, FileText, Loader2, Newspaper, Sparkles, Target } from 'lucide-react'
import { LineChart } from '@/components/charts'
import { ChangePill, Modal, Skeleton, TickerLogo } from '@/components/ui'
import { useAnalysts, useFinancials, useNews, useStockHistory, useStocks } from '@/hooks/useMarket'
import { vnNow } from '@/lib/time'
import { cn } from '@/utils/cn'
import { formatBillion, formatPercent, formatPrice, formatRatio, formatTime, formatVolume } from '@/utils/format'
import { dateTick, pct } from './shared'

/** Modal "Phân tích AI": tổng hợp nhanh từ báo cáo tài chính, khuyến nghị và tin tức. */
export function AnalysisModal({ open, onClose, stock }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <span className="flex items-center gap-3">
          <TickerLogo ticker={stock.ticker} color={stock.color} size={32} />
          <span>Phân tích AI {stock.ticker}</span>
          <ChangePill value={stock.changePct} size="sm" />
        </span>
      }
    >
      {open && <AnalysisBody stock={stock} />}
    </Modal>
  )
}

function AnalysisBody({ stock }) {
  const [ready, setReady] = useState(false)
  const [generatedAt] = useState(() => vnNow())
  const { data: hist } = useStockHistory(stock.ticker, '1Y')
  const { data: fin } = useFinancials(stock.ticker)
  const { data: an } = useAnalysts(stock.ticker)
  const { data: news } = useNews({ ticker: stock.ticker, limit: 8 })
  const { data: all } = useStocks()

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const loaded = ready && hist && fin && an && news && all

  const stats = useMemo(() => {
    if (!hist) return null
    const closes = hist.map((d) => d.value)
    const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, closes.length)
    const sector = (all ?? []).filter((s) => s.sector === stock.sector)
    const sectorPe = sector.length ? sector.reduce((a, s) => a + s.pe, 0) / sector.length : stock.pe
    return {
      sma20,
      sectorPe,
      rows: [
        ['Giá cuối', `${formatPrice(stock.price)}đ`, stock.changePct],
        ['Cao nhất 52 tuần', formatPrice(stock.high52), pct(stock.price, stock.high52)],
        ['Thấp nhất 52 tuần', formatPrice(stock.low52), pct(stock.price, stock.low52)],
        ['KL trung bình 20 phiên', formatVolume(stock.avgVolume), pct(stock.volume, stock.avgVolume)],
        ['SMA(20)', formatPrice(sma20), pct(stock.price, sma20)],
        ['Vốn hoá', formatBillion(stock.marketCap), stock.perf1Y],
        ['EPS (4 quý)', `${formatPrice(stock.eps)}đ`, stock.epsGrowth],
        ['P/E', formatRatio(stock.pe), pct(stock.pe, sectorPe)],
      ],
    }
  }, [hist, all, stock])

  const narrative = useMemo(() => (loaded ? buildNarrative(stock, fin, an, stats) : null), [loaded, stock, fin, an, stats])

  const sources = [
    { icon: FileText, label: 'Báo cáo tài chính', value: fin ? `${fin.quarterly.length} quý` : '…' },
    { icon: Target, label: 'Khuyến nghị CTCK', value: an ? `${an.total} công ty` : '…' },
    { icon: Newspaper, label: 'Tin tức', value: news ? `${news.length} bài` : '…' },
    { icon: BarChart3, label: 'Dữ liệu giá', value: hist ? `${hist.length} phiên` : '…' },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)_220px]">
      {/* Cột trái: biểu đồ + chỉ số */}
      <div className="min-w-0">
        <h3 className="ds-label mb-2">Diễn biến 1 năm</h3>
        {hist ? (
          <LineChart
            height={150}
            showYAxis={false}
            grid={false}
            series={[{ id: 'p', label: stock.ticker, color: stock.perf1Y >= 0 ? '#2fd28a' : '#ff5a6a', area: true, data: hist }]}
            yFormat={(v) => formatPrice(v)}
            xFormat={dateTick}
          />
        ) : (
          <Skeleton className="h-[150px]" />
        )}
        <ul className="mt-3">
          {(stats?.rows ?? []).map(([label, value, change]) => (
            <li key={label} className="flex items-center justify-between gap-3 border-b border-line py-2 text-[13px] last:border-0">
              <span className="text-muted">{label}</span>
              <span className="flex items-center gap-2">
                <span className="num font-medium">{value}</span>
                {change != null && <ChangePill value={change} size="sm" digits={1} />}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cột giữa: nội dung tổng hợp */}
      <div className="min-w-0 rounded-2xl border border-line bg-base/60 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-brand" /> Tóm tắt về {stock.name}
          </h3>
          <span className="text-xs text-muted">{loaded ? `Tạo lúc ${formatTime(generatedAt)}` : 'Đang tổng hợp…'}</span>
        </div>
        {!narrative ? (
          <div className="space-y-5">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-fade-in space-y-5">
            {narrative.map((s) => (
              <div key={s.title}>
                <h4 className="mb-1.5 text-[14px] font-semibold text-fg">{s.title}</h4>
                <p className="text-[13.5px] leading-relaxed text-dim">{s.body}</p>
              </div>
            ))}
            <p className="border-t border-line pt-3 text-[11.5px] text-faint">Nội dung được tạo tự động từ dữ liệu mô phỏng, chỉ mang tính tham khảo và không phải khuyến nghị đầu tư.</p>
          </div>
        )}
      </div>

      {/* Cột phải: nguồn */}
      <div>
        <h3 className="ds-label mb-2">Nguồn dữ liệu</h3>
        <ul className="space-y-2">
          {sources.map(({ icon: Icon, label, value }) => (
            <li key={label} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-overlay text-dim">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-fg">{label}</span>
                <span className={cn('block text-[11.5px]', loaded ? 'text-muted' : 'text-brand')}>
                  {loaded ? value : (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" /> Đang quét
                    </span>
                  )}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function buildNarrative(s, fin, an, stats) {
  const q = fin.quarterly
  const last = q[q.length - 1]
  const yoy = q[q.length - 5]
  const revG = yoy ? pct(last.revenue, yoy.revenue) : s.revenueGrowth
  const niG = yoy ? pct(last.netIncome, yoy.netIncome) : s.epsGrowth
  const de = last.debt / last.equity
  const cashCover = last.cash / Math.max(1, last.debt)
  const fcf4 = q.slice(-4).reduce((a, r) => a + r.fcf, 0)
  const vsHigh = pct(s.price, s.high52)
  const aboveSma = s.price >= stats.sma20
  const peGap = pct(s.pe, stats.sectorPe)
  const buyShare = Math.round(((an.counts.strong_buy + an.counts.buy) / an.total) * 100)

  return [
    {
      title: 'Cơ bản doanh nghiệp',
      body: `${s.ticker} hoạt động trong ngành ${s.sectorName.toLowerCase()} với vốn hoá ${formatBillion(s.marketCap)}. Quý ${last.period} doanh thu đạt ${formatBillion(last.revenue)} (${formatPercent(revG, { digits: 1 })} so với cùng kỳ), lợi nhuận sau thuế ${formatBillion(last.netIncome)} (${formatPercent(niG, { digits: 1 })}). Biên lợi nhuận gộp ${formatPercent(last.grossMargin, { sign: false, digits: 1 })}, ROE ${formatPercent(s.roe, { sign: false, digits: 1 })} — ${s.roe >= 15 ? 'thuộc nhóm hiệu quả cao' : 'ở mức trung bình'} của thị trường.`,
    },
    {
      title: 'Sức khoẻ tài chính',
      body: `Tỷ lệ nợ vay trên vốn chủ ở mức ${formatRatio(de, 2)} lần${de < 0.5 ? ', đòn bẩy thấp và an toàn' : de < 1 ? ', trong ngưỡng kiểm soát' : ', tương đối cao cần theo dõi'}. Tiền mặt bằng ${formatRatio(cashCover, 1)} lần nợ vay. Dòng tiền tự do 4 quý gần nhất ${fcf4 >= 0 ? 'dương' : 'âm'} ${formatBillion(Math.abs(fcf4))}${s.dividendYield > 0 ? `, hỗ trợ chính sách cổ tức với tỷ suất khoảng ${formatPercent(s.dividendYield, { sign: false })}` : ''}.`,
    },
    {
      title: 'Rủi ro & thách thức',
      body: `Cổ phiếu đang giao dịch ${aboveSma ? 'trên' : 'dưới'} đường trung bình 20 phiên và cách đỉnh 52 tuần ${formatPercent(Math.abs(vsHigh), { sign: false, digits: 1 })}. Hệ số beta ${formatRatio(s.beta, 2)} cho thấy biến động ${s.beta > 1.1 ? 'mạnh hơn' : s.beta < 0.9 ? 'thấp hơn' : 'tương đương'} thị trường chung. P/E ${formatRatio(s.pe)} ${peGap > 0 ? 'cao hơn' : 'thấp hơn'} trung bình ngành ${formatPercent(Math.abs(peGap), { sign: false, digits: 0 })}${peGap > 15 ? ', kỳ vọng tăng trưởng đã phản ánh phần nào vào giá' : ''}.`,
    },
    {
      title: 'Đánh giá của CTCK',
      body: `${an.total} công ty chứng khoán đang theo dõi, ${buyShare}% khuyến nghị Mua hoặc Mua mạnh; đồng thuận chung là "${an.consensus}". Giá mục tiêu trung vị ${formatPrice(an.target.median)}đ, tương ứng ${formatPercent(an.target.upside, { digits: 1 })} so với giá hiện tại (khoảng ${formatPrice(an.target.low)} – ${formatPrice(an.target.high)}đ).`,
    },
  ]
}
