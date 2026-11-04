import { ArrowDownRight, ArrowUpRight, Trash2 } from 'lucide-react'
import { Sparkline } from '@/components/charts'
import { ChangePill } from '@/components/ui'

/** Bảng thống kê từng chuỗi: thấp nhất / trung bình / cao nhất / xu hướng / thay đổi. */
export function SeriesTable({ series, onRemove, changeLabel }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-[13px]">
        <thead>
          <tr className="text-left text-muted">
            <th className="py-2.5 pr-4 font-medium">Chuỗi</th>
            <th className="px-4 py-2.5 text-right font-medium">Thấp nhất</th>
            <th className="px-4 py-2.5 text-right font-medium">Trung bình</th>
            <th className="px-4 py-2.5 text-right font-medium">Cao nhất</th>
            <th className="px-4 py-2.5 font-medium">Xu hướng</th>
            <th className="px-4 py-2.5 text-right font-medium">{changeLabel}</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {series.map((s) => {
            const vals = s.data.map((d) => d.value).filter((v) => v != null)
            if (!vals.length) return null
            const min = Math.min(...vals)
            const max = Math.max(...vals)
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length
            const change = vals[0] ? (vals[vals.length - 1] / vals[0] - 1) * 100 * Math.sign(vals[0]) : null
            return (
              <tr key={s.id} className="border-t border-line">
                <td className="py-3 pr-4">
                  <span className="flex items-center gap-2.5">
                    <span className="h-6 w-1 rounded-full" style={{ background: s.color }} />
                    <span>
                      <span className="block font-semibold">{s.label}</span>
                      <span className="block max-w-[180px] truncate text-[11.5px] text-muted">{s.name}</span>
                    </span>
                  </span>
                </td>
                <td className="num px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1">
                    <ArrowDownRight className="size-3.5 text-down" aria-hidden />
                    {s.format(min)}
                  </span>
                </td>
                <td className="num px-4 py-3 text-right text-dim">{s.format(avg)}</td>
                <td className="num px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1">
                    <ArrowUpRight className="size-3.5 text-up" aria-hidden />
                    {s.format(max)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Sparkline values={vals.length > 80 ? vals.filter((_, i) => i % Math.ceil(vals.length / 80) === 0 || i === vals.length - 1) : vals} width={110} height={28} />
                </td>
                <td className="px-4 py-3 text-right">{change != null ? <ChangePill value={change} /> : '—'}</td>
                <td className="py-3 text-right">
                  <button type="button" onClick={() => onRemove(s.id)} disabled={series.length <= 1} aria-label={`Xoá ${s.label}`} className="rounded-lg p-1.5 text-faint hover:bg-raised hover:text-down disabled:opacity-30">
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
