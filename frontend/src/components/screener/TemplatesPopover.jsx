import { useState } from 'react'
import { BookmarkPlus, LayoutTemplate, Sparkles, X } from 'lucide-react'
import { Button, Chip, Input, Modal, Popover } from '@/components/ui'
import { useDeleteTemplate, useSaveTemplate, useTemplates } from '@/hooks/useAccount'
import { BUILTIN_TEMPLATES, describeFilters } from './filters'

/** Popover "Mẫu bộ lọc": mẫu có sẵn + mẫu của người dùng + lưu bộ lọc hiện tại. */
export function TemplatesPopover({ open, onClose, filters, onApply, onSaveClick }) {
  const { data: mine = [] } = useTemplates()
  const del = useDeleteTemplate()
  return (
    <Popover open={open} onClose={onClose} align="right" className="w-[300px]">
      <div className="px-2.5 pt-1.5 pb-1 text-[11.5px] font-medium text-faint">Hành động</div>
      <button
        type="button"
        disabled={!filters.length}
        onClick={() => {
          onClose()
          onSaveClick()
        }}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-dim hover:bg-hover hover:text-fg disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <BookmarkPlus className="size-4" /> Lưu bộ lọc hiện tại
      </button>

      <div className="px-2.5 pt-3 pb-1 text-[11.5px] font-medium text-faint">Mẫu gợi ý</div>
      {BUILTIN_TEMPLATES.map((t) => (
        <TemplateRow key={t.id} icon={Sparkles} t={t} onApply={onApply} onClose={onClose} />
      ))}

      <div className="px-2.5 pt-3 pb-1 text-[11.5px] font-medium text-faint">Mẫu của bạn</div>
      {mine.length ? (
        mine.map((t) => <TemplateRow key={t.id} icon={LayoutTemplate} t={t} onApply={onApply} onClose={onClose} onDelete={() => del.mutate(t.id)} />)
      ) : (
        <p className="px-2.5 pb-2 text-xs text-muted">Chưa có mẫu nào. Hãy thêm bộ lọc rồi lưu lại để dùng nhanh.</p>
      )}
    </Popover>
  )
}

function TemplateRow({ t, icon: Icon, onApply, onClose, onDelete }) {
  return (
    <div className="group flex items-center rounded-lg hover:bg-hover">
      <button
        type="button"
        onClick={() => {
          onApply(t)
          onClose()
        }}
        className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2 text-left text-sm text-dim group-hover:text-fg"
        title={describeFilters(t.filters).join(' · ')}
      >
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{t.name}</span>
        <span className="ml-auto shrink-0 text-[11px] text-faint">{t.filters.length} tiêu chí</span>
      </button>
      {onDelete && (
        <button type="button" onClick={onDelete} aria-label={`Xoá mẫu ${t.name}`} className="mr-1.5 rounded-md p-1 text-faint opacity-0 group-hover:opacity-100 hover:text-down focus-visible:opacity-100">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

/** Modal đặt tên & lưu mẫu. */
export function SaveTemplateModal({ open, onClose, filters, sort }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const save = useSaveTemplate()
  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Vui lòng đặt tên cho mẫu.')
    save.mutate(
      { name, filters, sort },
      {
        onSuccess: () => {
          setName('')
          onClose()
        },
        onError: (err) => setError(err.fields?.name ?? err.message),
      },
    )
  }
  return (
    <Modal open={open} onClose={onClose} title="Lưu mẫu bộ lọc" description="Mẫu được lưu vào tài khoản để bạn dùng lại bất cứ lúc nào." size="sm">
      <form onSubmit={submit} className="space-y-5">
        <Input
          data-autofocus
          autoFocus
          label="Tên mẫu"
          placeholder="VD: Cổ phiếu cổ tức của tôi"
          value={name}
          maxLength={50}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          error={error}
        />
        <div>
          <div className="mb-2 text-[13px] font-medium text-dim">Tiêu chí</div>
          <div className="flex flex-wrap gap-1.5">
            {describeFilters(filters).map((d) => (
              <Chip key={d}>{d}</Chip>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" variant="primary" loading={save.isPending}>
            Lưu mẫu
          </Button>
        </div>
      </form>
    </Modal>
  )
}
