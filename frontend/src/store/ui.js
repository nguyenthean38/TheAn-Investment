import { create } from 'zustand'

let toastSeq = 0

/**
 * State giao diện toàn cục (không phải dữ liệu server):
 * bảng lệnh ⌘K, bảng phím tắt, panel danh sách theo dõi, modal góp ý, toast.
 */
export const useUI = create((set, get) => ({
  /* Bảng lệnh: mode = 'root' | 'search' | 'feedback' | 'referral' | 'markets' … */
  palette: { open: false, mode: 'root', context: null },
  openPalette: (mode = 'root', context = null) => set({ palette: { open: true, mode, context } }),
  setPaletteMode: (mode, context = null) => set((s) => ({ palette: { ...s.palette, mode, context } })),
  closePalette: () => set((s) => ({ palette: { ...s.palette, open: false } })),

  shortcutsOpen: false,
  setShortcutsOpen: (v) => set({ shortcutsOpen: v }),

  watchPanelOpen: false,
  setWatchPanelOpen: (v) => set({ watchPanelOpen: v }),

  /* Toast */
  toasts: [],
  toast: (message, tone = 'info') => {
    const id = ++toastSeq
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, tone }] }))
    setTimeout(() => get().dismissToast(id), 3600)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
