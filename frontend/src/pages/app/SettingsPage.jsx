import { AppHeader } from '@/components/layout/AppHeader'
import { AccountCard } from '@/components/settings/AccountCard'
import { ReferralCard } from '@/components/settings/ReferralCard'
import { MembershipCard, PaymentCard } from '@/components/settings/MembershipCard'

export default function SettingsPage() {
  return (
    <>
      <AppHeader title="Cài đặt" subtitle="Tài khoản, tuỳ chọn hiển thị và gói thành viên" />
      <main className="container-app grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <AccountCard />
          <ReferralCard />
        </div>
        <div className="space-y-6 lg:sticky lg:top-6">
          <MembershipCard />
          <PaymentCard />
        </div>
      </main>
    </>
  )
}
