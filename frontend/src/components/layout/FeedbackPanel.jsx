import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ImagePlus, Loader2, MailCheck, Send, X } from 'lucide-react'
import { brand } from '@/config/brand'
import { Button } from '@/components/ui'
import { useOverlayBehavior } from '@/components/ui/Overlay'
import { useSendFeedback } from '@/hooks/useAccount'
import { useMe } from '@/hooks/useAuth'
import { useUI } from '@/store/ui'

const MAX_FILE = 5 * 1024 * 1024

/** Góp ý dạng bảng lệnh: nội dung + đính kèm ảnh, trạng thái gửi thành công. */
export function FeedbackPanel({ onClose }) {
  const panelRef = useOverlayBehavior(true, onClose)
  const fileRef = useRef(null)
  const { data: me } = useMe()
  const send = useSendFeedback()
  const setMode = useUI((s) => s.setPaletteMode)
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')

  const onPick = (e) => {
    const list = [...(e.target.files ?? [])]
    e.target.value = ''
    const bad = list.find((f) => !f.type.startsWith('image/') || f.size > MAX_FILE)
    if (bad) return setError('Chỉ nhận ảnh (PNG, JPG…) tối đa 5 MB.')
    setError('')
    list.slice(0, 3 - files.length).forEach((f) => {
      const id = `${f.name}-${f.size}`
      setFiles((x) => [...x, { id, name: f.name, url: URL.createObjectURL(f), uploading: true }])
      setTimeout(() => setFiles((x) => x.map((it) => (it.id === id ? { ...it, uploading: false } : it))), 900)
    })
  }

  const submit = () => {
    if (message.trim().length < 5) return setError('Hãy viết ít nhất 5 ký tự nhé.')
    setError('')
    send.mutate({ message, attachments: files.map((f) => f.name) }, { onError: (e) => setError(e.message) })
  }

  const done = send.isSuccess
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-3 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-[3px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Gửi góp ý"
        tabIndex={-1}
        className="relative w-full max-w-[560px] animate-pop overflow-hidden rounded-[22px] border border-line-strong bg-raised shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between px-4 pt-3.5">
          <button type="button" onClick={() => setMode('root')} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-overlay py-1 pr-3 pl-1.5 text-xs font-medium text-dim hover:text-fg">
            <ChevronLeft className="size-3.5" /> Góp ý
          </button>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-full p-1.5 text-muted hover:bg-overlay hover:text-fg">
            <X className="size-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center px-8 pt-8 pb-10 text-center">
            <div className="relative mb-5">
              <div className="absolute inset-0 rounded-full bg-brand/30 blur-2xl" />
              <div className="relative flex size-16 items-center justify-center rounded-2xl border border-line-strong bg-overlay text-brand">
                <MailCheck className="size-7" />
              </div>
            </div>
            <h2 className="ds-h2">Cảm ơn {me?.name ?? 'bạn'}!</h2>
            <p className="mt-2 max-w-sm text-sm text-muted">Chúng tôi đã nhận được góp ý của bạn. Đội ngũ Nhịp đọc mọi tin nhắn và sẽ phản hồi qua email nếu cần.</p>
            <Button variant="secondary" className="mt-6" onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : (
          <>
            <div className="px-4 pt-3">
              <textarea
                data-autofocus
                autoFocus
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Bạn gặp lỗi, có ý tưởng hay chỉ muốn gửi lời chào?"
                aria-label="Nội dung góp ý"
                maxLength={2000}
                className="h-40 w-full resize-none bg-transparent text-[15px] text-fg outline-none placeholder:text-faint"
              />
              {files.length > 0 && (
                <div className="flex gap-2 pb-3">
                  {files.map((f) => (
                    <div key={f.id} className="relative size-16 overflow-hidden rounded-xl border border-line-strong">
                      <img src={f.url} alt={f.name} className="size-full object-cover" />
                      {f.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <Loader2 className="size-4 animate-spin" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setFiles((x) => x.filter((it) => it.id !== f.id))}
                        aria-label={`Bỏ ${f.name}`}
                        className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5 text-white"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {error && <p className="pb-2 text-xs text-down">{error}</p>}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3">
              <span className="truncate text-xs text-muted">
                Hoặc viết cho chúng tôi: <span className="text-dim">{brand.email}</span>
              </span>
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
                <Button variant="ghost" size="sm" icon aria-label="Đính kèm ảnh" onClick={() => fileRef.current?.click()} disabled={files.length >= 3}>
                  <ImagePlus className="size-4" />
                </Button>
                <Button variant="primary" size="sm" onClick={submit} loading={send.isPending} disabled={files.some((f) => f.uploading)}>
                  Gửi <Send className="size-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
