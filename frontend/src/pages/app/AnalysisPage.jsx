import { useSearchParams } from 'react-router-dom'
import { Globe2, Landmark, UserRoundSearch } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { Tabs } from '@/components/ui'
import { MacroTab } from '@/components/analysis/MacroTab'
import { MarketsTab } from '@/components/analysis/MarketsTab'
import { InsidersTab } from '@/components/analysis/InsidersTab'

const TABS = [
  { value: 'vi-mo', label: 'Vĩ mô', icon: Landmark },
  { value: 'thi-truong', label: 'Thị trường', icon: Globe2 },
  { value: 'noi-bo', label: 'Giao dịch nội bộ', icon: UserRoundSearch },
]

/** Phân tích: vĩ mô, thị trường trong & ngoài nước, giao dịch nội bộ. Tab đồng bộ với `?tab=`. */
export default function AnalysisPage() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'vi-mo'
  const setTab = (v) => setParams(v === 'vi-mo' ? {} : { tab: v }, { replace: true })

  return (
    <>
      <AppHeader title="Phân tích" subtitle="Bức tranh vĩ mô, dòng tiền và hành vi người nội bộ" />
      <main className="container-app">
        <Tabs options={TABS} value={tab} onChange={setTab} className="mb-6 gap-4 sm:gap-5" />
        {tab === 'vi-mo' && <MacroTab />}
        {tab === 'thi-truong' && <MarketsTab />}
        {tab === 'noi-bo' && <InsidersTab />}
      </main>
    </>
  )
}
