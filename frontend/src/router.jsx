import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet, ScrollRestoration } from 'react-router-dom'
import { AppLayout, PageFallback } from '@/components/layout/AppLayout'
import NotFoundPage, { RouteErrorPage } from '@/pages/NotFoundPage'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const AuthPage = lazy(() => import('@/pages/auth/AuthPage'))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'))
const HomePage = lazy(() => import('@/pages/app/HomePage'))
const AnalysisPage = lazy(() => import('@/pages/app/AnalysisPage'))
const CalendarPage = lazy(() => import('@/pages/app/CalendarPage'))
const PortfolioPage = lazy(() => import('@/pages/app/PortfolioPage'))
const ComparePage = lazy(() => import('@/pages/app/ComparePage'))
const ScreenerPage = lazy(() => import('@/pages/app/ScreenerPage'))
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage'))
const CancelMembershipPage = lazy(() => import('@/pages/app/CancelMembershipPage'))
const StockPage = lazy(() => import('@/pages/app/StockPage'))

function Root() {
  return (
    <>
      <ScrollRestoration getKey={(loc) => loc.pathname} />
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
    </>
  )
}

/**
 * Bản đồ route — xem docs/SCREEN_MAP.md.
 * Công khai: /, /dang-nhap, /dang-ky, /bat-dau (cần đăng nhập, xử lý trong trang).
 * Ứng dụng (/app/*): bọc bởi AppLayout (yêu cầu đăng nhập + đã qua onboarding).
 */
export const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/dang-nhap', element: <AuthPage mode="login" /> },
      { path: '/dang-ky', element: <AuthPage mode="signup" /> },
      { path: '/bat-dau', element: <OnboardingPage /> },
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'phan-tich', element: <AnalysisPage /> },
          { path: 'lich', element: <CalendarPage /> },
          { path: 'danh-muc', element: <PortfolioPage /> },
          { path: 'so-sanh', element: <ComparePage /> },
          { path: 'bo-loc', element: <ScreenerPage /> },
          { path: 'cai-dat', element: <SettingsPage /> },
          { path: 'cai-dat/huy-goi', element: <CancelMembershipPage /> },
          { path: 'co-phieu/:ticker', element: <StockPage /> },
          { path: '*', element: <NotFoundPage inApp /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
