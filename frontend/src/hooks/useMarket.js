import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { marketApi, stockApi } from '@/api'
import { qk } from './queryClient'

/* ---- Thị trường ---- */
export const useOverview = () => useQuery({ queryKey: qk.overview, queryFn: marketApi.overview })
export const useIndexHistory = (code, range) =>
  useQuery({ queryKey: qk.indexHistory(code, range), queryFn: () => marketApi.indexHistory(code, range), placeholderData: keepPreviousData })
export const useSectors = () => useQuery({ queryKey: qk.sectors, queryFn: marketApi.sectors })
export const useMovers = () => useQuery({ queryKey: qk.movers, queryFn: marketApi.movers })
export const useForeignMarket = () => useQuery({ queryKey: qk.foreign, queryFn: marketApi.foreign })
export const useGlobalMarkets = () => useQuery({ queryKey: qk.global, queryFn: marketApi.global })
export const useMacro = () => useQuery({ queryKey: qk.macro, queryFn: marketApi.macro })
export const useMarketInsiders = (params = {}) => useQuery({ queryKey: qk.marketInsiders(params), queryFn: () => marketApi.insiders(params) })
export const useRecap = () => useQuery({ queryKey: qk.recap, queryFn: marketApi.recap })
export const useNews = (params = {}) => useQuery({ queryKey: qk.news(params), queryFn: () => marketApi.news(params) })
export const useEvents = () => useQuery({ queryKey: qk.events, queryFn: marketApi.events })

/* ---- Cổ phiếu ---- */
export const useStocks = () => useQuery({ queryKey: qk.stocks, queryFn: stockApi.list, staleTime: 5 * 60_000 })
export const useStockSearch = (q, limit = 8) =>
  useQuery({ queryKey: qk.search(`${q}|${limit}`), queryFn: () => stockApi.search(q, limit), placeholderData: keepPreviousData })
export const useStock = (t) => useQuery({ queryKey: qk.stock(t), queryFn: () => stockApi.get(t), enabled: !!t })
export const useStockHistory = (t, range) =>
  useQuery({ queryKey: qk.history(t, range), queryFn: () => stockApi.history(t, range), enabled: !!t, placeholderData: keepPreviousData })
export const useFinancials = (t) => useQuery({ queryKey: qk.financials(t), queryFn: () => stockApi.financials(t), enabled: !!t })
export const useEarnings = (t) => useQuery({ queryKey: qk.earnings(t), queryFn: () => stockApi.earnings(t), enabled: !!t })
export const useAnalysts = (t) => useQuery({ queryKey: qk.analysts(t), queryFn: () => stockApi.analysts(t), enabled: !!t })
export const useInsiders = (t) => useQuery({ queryKey: qk.insiders(t), queryFn: () => stockApi.insiders(t), enabled: !!t })
export const useStockForeign = (t) => useQuery({ queryKey: qk.stockForeign(t), queryFn: () => stockApi.foreign(t), enabled: !!t })
export const usePeers = (t, tickers) =>
  useQuery({ queryKey: qk.peers(t, tickers?.join(',') ?? 'default'), queryFn: () => stockApi.peers(t, tickers), enabled: !!t, placeholderData: keepPreviousData })
