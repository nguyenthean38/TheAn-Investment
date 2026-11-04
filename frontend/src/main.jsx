import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@fontsource/jetbrains-mono/500.css'
import './styles/index.css'
import { Toaster } from '@/components/ui'
import { queryClient, qk } from '@/hooks/queryClient'
import { setUnauthorizedHandler } from '@/api/http'
import { router } from './router'

// Phiên hết hạn → xoá người dùng khỏi cache, AppLayout sẽ chuyển về trang đăng nhập.
setUnauthorizedHandler(() => queryClient.setQueryData(qk.me, null))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)
