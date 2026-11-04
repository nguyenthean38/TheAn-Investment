import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, X } from 'lucide-react'
import { Button, ExchangeBadge, Input, Modal, TickerLogo } from '@/components/ui'
import { useStockSearch } from '@/hooks/useMarket'
import { useAddHolding, useUpdateHolding } from '@/hooks/useWatchlists'
import { formatPrice } from '@/utils/format'
import { cn } from '@/utils/cn'

const toNumber = (v) => {
  if (typeof v === 'number') return v
  const s = String(v ?? '').replace(/[.\s]/g, '').replace(',', '.')
  return s === '' ? NaN : Number(s)
}

const schema = z.object({
  ticker: z.string().min(1, 'Vui lòng chọn mã cổ phiếu.'),
  quantity: z
    .number({ error: 'Vui lòng nhập khối lượng.' })
    .int('Khối lượng phải là số nguyên.')
    .positive('Khối lượng phải lớn hơn 0.')
    .refine((v) => v % 10 === 0, 'Khối lượng phải là bội số của 10.'),
  avgPrice: z.number({ error: 'Vui lòng nhập giá vốn.' }).positive('Giá vốn phải lớn hơn 0.').max(5_000_000, 'Giá vốn có vẻ chưa đúng.'),
})

/** Ô chọn mã cổ phiếu có tìm kiếm. */
function TickerPicker({ value, onChange, error, disabled, stocks }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const { data: results = [] } = useStockSearch(q.trim(), 6)
  const selected = value ? stocks.get(value) : null

  if (selected) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-dim">Mã cổ phiếu</span>
        <div className="flex h-11 items-center gap-3 rounded-xl border border-line-strong bg-base px-3">
          <TickerLogo ticker={selected.ticker} color={selected.color} size={26} />
          <span className="min-w-0 flex-1 truncate text-sm">
            <span className="font-semibold">{selected.ticker}</span> <span className="text-muted">· {selected.name}</span>
          </span>
          {!disabled && (
            <button type="button" onClick={() => onChange('')} aria-label="Đổi mã" className="rounded-md p-1 text-muted hover:text-fg">
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <Input
        label="Mã cổ phiếu"
        leading={<Search className="size-4" />}
        value={q}
        error={error}
        placeholder="Nhập mã hoặc tên công ty"
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) {
            e.preventDefault()
            onChange(results[0].ticker)
          }
        }}
      />
      {open && results.length > 0 && (
        <ul className="absolute top-[74px] right-0 left-0 z-20 max-h-64 overflow-y-auto rounded-2xl border border-line-strong bg-raised p-1.5 shadow-2xl">
          {results.map((s) => (
            <li key={s.ticker}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onChange(s.ticker)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-hover"
              >
                <TickerLogo ticker={s.ticker} color={s.color} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{s.ticker}</span>
                  <span className="block truncate text-xs text-muted">{s.name}</span>
                </span>
                <span className="num text-xs text-dim">{formatPrice(s.price)}</span>
                <ExchangeBadge exchange={s.exchange} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Modal thêm / sửa vị thế nắm giữ. `holding`: vị thế đang sửa (null = thêm mới). */
export function HoldingModal({ open, onClose, holding, stocks }) {
  const add = useAddHolding()
  const update = useUpdateHolding()
  const editing = !!holding
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { ticker: '', quantity: '', avgPrice: '' },
  })

  useEffect(() => {
    if (open)
      reset(
        holding
          ? { ticker: holding.ticker, quantity: holding.quantity, avgPrice: holding.avgPrice }
          : { ticker: '', quantity: '', avgPrice: '' },
      )
  }, [open, holding, reset])

  const ticker = watch('ticker')
  const qty = toNumber(watch('quantity'))
  const price = toNumber(watch('avgPrice'))
  const stock = ticker ? stocks.get(ticker) : null
  const cost = qty > 0 && price > 0 ? qty * price : null

  const onSubmit = (v) => {
    const opts = {
      onSuccess: onClose,
      onError: (e) => {
        if (e.fields) Object.entries(e.fields).forEach(([k, msg]) => setError(k, { message: msg }))
        else setError('root', { message: e.message })
      },
    }
    if (editing) update.mutate({ id: holding.id, quantity: v.quantity, avgPrice: v.avgPrice }, opts)
    else add.mutate({ ticker: v.ticker, quantity: v.quantity, avgPrice: v.avgPrice }, opts)
  }

  const numberField = { setValueAs: toNumber }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Sửa vị thế ${holding.ticker}` : 'Thêm vị thế'}
      description="Nhập khối lượng và giá vốn bình quân để Nhịp theo dõi lãi/lỗ giúp bạn."
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="num text-sm text-muted">
            Giá trị vốn: <span className="font-semibold text-fg">{cost ? `${formatPrice(cost)} đ` : '—'}</span>
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Huỷ
            </Button>
            <Button variant="primary" type="submit" form="holding-form" loading={add.isPending || update.isPending}>
              {editing ? 'Lưu thay đổi' : 'Thêm vị thế'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="holding-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Controller
          name="ticker"
          control={control}
          render={({ field }) => <TickerPicker value={field.value} onChange={field.onChange} error={errors.ticker?.message} disabled={editing} stocks={stocks} />}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Khối lượng (cổ phiếu)" inputMode="numeric" placeholder="VD: 1.000" hint="Bội số của 10." error={errors.quantity?.message} {...register('quantity', numberField)} />
          <Input label="Giá vốn bình quân (đồng)" inputMode="numeric" placeholder="VD: 104.500" error={errors.avgPrice?.message} {...register('avgPrice', numberField)} />
        </div>
        {stock && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-base px-3.5 py-2.5 text-sm">
            <span className="text-muted">
              Giá hiện tại {stock.ticker}: <span className="num font-medium text-fg">{formatPrice(stock.price)} đ</span>
            </span>
            <button
              type="button"
              onClick={() => setValue('avgPrice', stock.price, { shouldValidate: true })}
              className="text-xs font-medium text-brand hover:underline"
            >
              Dùng giá này
            </button>
          </div>
        )}
        {errors.root && <p className={cn('rounded-xl bg-down/10 px-3 py-2 text-sm text-down')}>{errors.root.message}</p>}
      </form>
    </Modal>
  )
}
