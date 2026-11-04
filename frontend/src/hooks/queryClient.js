import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => (error?.status ?? 500) >= 500 && count < 2,
    },
  },
})

/** Query keys tập trung — dùng chung cho invalidate. */
export const qk = {
  me: ['me'],
  overview: ['market', 'overview'],
  indexHistory: (code, range) => ['market', 'index', code, range],
  sectors: ['market', 'sectors'],
  movers: ['market', 'movers'],
  foreign: ['market', 'foreign'],
  global: ['market', 'global'],
  macro: ['market', 'macro'],
  marketInsiders: (p) => ['market', 'insiders', p],
  recap: ['market', 'recap'],
  news: (p) => ['news', p],
  events: ['events'],
  stocks: ['stocks'],
  search: (q) => ['stocks', 'search', q],
  stock: (t) => ['stock', t],
  history: (t, range) => ['stock', t, 'history', range],
  financials: (t) => ['stock', t, 'financials'],
  earnings: (t) => ['stock', t, 'earnings'],
  analysts: (t) => ['stock', t, 'analysts'],
  insiders: (t) => ['stock', t, 'insiders'],
  stockForeign: (t) => ['stock', t, 'foreign'],
  peers: (t, list) => ['stock', t, 'peers', list],
  watchlists: ['watchlists'],
  holdings: ['holdings'],
  templates: ['templates'],
  subscription: ['subscription'],
  referrals: ['referrals'],
}
