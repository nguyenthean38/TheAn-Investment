import { forwardRef, useId } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

/** Ô nhập chuẩn. `leading`: icon bên trái. `pill`: bo tròn hoàn toàn. */
export const Input = forwardRef(function Input({ label, error, hint, leading, trailing, pill, className, inputClassName, id, ...rest }, ref) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-dim">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex h-11 items-center gap-2 border bg-base px-3.5 transition-colors focus-within:border-brand/60 focus-within:bg-surface',
          pill ? 'rounded-full px-5' : 'rounded-xl',
          error ? 'border-down/60' : 'border-line-strong',
        )}
      >
        {leading && <span className="shrink-0 text-muted">{leading}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-err` : undefined}
          className={cn('h-full min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-faint', inputClassName)}
          {...rest}
        />
        {trailing}
      </div>
      {error ? (
        <p id={`${inputId}-err`} className="text-xs text-down">
          {error}
        </p>
      ) : hint ? (
        <p className="ds-caption">{hint}</p>
      ) : null}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea({ label, error, className, id, ...rest }, ref) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-dim">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={cn(
          'min-h-28 resize-y rounded-xl border bg-base px-3.5 py-3 text-sm text-fg outline-none transition-colors placeholder:text-faint focus:border-brand/60',
          error ? 'border-down/60' : 'border-line-strong',
        )}
        {...rest}
      />
      {error && <p className="text-xs text-down">{error}</p>}
    </div>
  )
})

/** Công tắc bật/tắt. */
export function Toggle({ checked, onChange, label, description, disabled, className }) {
  const id = useId()
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {(label || description) && (
        <label htmlFor={id} className="min-w-0 cursor-pointer">
          <div className="text-sm text-fg">{label}</div>
          {description && <div className="ds-caption mt-0.5">{description}</div>}
        </label>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full border transition-colors disabled:opacity-40',
          checked ? 'border-brand bg-brand' : 'border-line-strong bg-overlay',
        )}
      >
        <span className={cn('absolute top-0.5 size-[18px] rounded-full bg-white shadow transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
      </button>
    </div>
  )
}

/** Ô đánh dấu tròn nhỏ. */
export function Checkbox({ checked, onChange, label, className, ...rest }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={typeof label === 'string' ? label : undefined}
      onClick={(e) => {
        e.stopPropagation()
        onChange?.(!checked)
      }}
      className={cn(
        'inline-flex size-[18px] shrink-0 items-center justify-center rounded-md border transition-colors',
        checked ? 'border-brand bg-brand text-canvas' : 'border-line-strong bg-base hover:border-muted',
        className,
      )}
      {...rest}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </button>
  )
}

/** Nút radio dạng thẻ chọn. */
export function RadioCard({ checked, onSelect, children, className }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        'relative w-full rounded-2xl border p-4 text-left transition-all',
        checked ? 'border-brand/70 bg-brand/[0.06] shadow-[0_0_0_4px_rgb(255_163_108/0.08)]' : 'border-line-strong bg-surface hover:border-muted',
        className,
      )}
    >
      {children}
    </button>
  )
}
