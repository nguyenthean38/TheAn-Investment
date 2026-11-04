# Bản đồ màn hình

Bảng dưới đây đối chiếu từng route của Nhịp với ảnh tham khảo trong `Fey web Apr 2025/`. Nhịp không sao chép nguyên giao diện mà thiết kế lại cho thị trường Việt Nam.

| Route | File | Ảnh tham khảo | Ghi chú thiết kế lại |
|---|---|---|---|
| `/` | `pages/LandingPage.jsx` | 0, 43, 143–144 | Bản xem trước dùng dữ liệu thật; bảng giá tính bằng VND |
| `/dang-nhap`, `/dang-ky` | `pages/auth/AuthPage.jsx` | 2–5, 145–149 | Đăng nhập bằng magic link, có nút "Dùng tài khoản demo" |
| `/bat-dau` | `pages/OnboardingPage.jsx` | 7–13 | Thêm bước chọn ngành quan tâm và thêm mã vào danh sách theo dõi |
| `/app` | `pages/app/HomePage.jsx` | 14, 19–20, 73 | VN-Index cùng chỉ số biến động, độ rộng thị trường, khối ngoại, ngành |
| `/app/co-phieu/:ticker` | `pages/app/StockPage.jsx` | 22–37, 44–68, 109 | Giá trần/sàn/tham chiếu, khuyến nghị CTCK, khối ngoại, giao dịch nội bộ |
| `/app/phan-tich` | `pages/app/AnalysisPage.jsx` | 69–72 | Vĩ mô Việt Nam (CPI, TPCP, NHNN), thị trường thế giới, giao dịch nội bộ |
| `/app/lich` | `pages/app/CalendarPage.jsx` | 74–78 | KQKD, ngày GDKHQ cổ tức, ĐHCĐ, đáo hạn phái sinh |
| `/app/danh-muc` | `pages/app/PortfolioPage.jsx` | 79–90, 110–122 | Danh mục nắm giữ nhập thủ công (thay cho kết nối Plaid) |
| `/app/so-sanh` | `pages/app/ComparePage.jsx` | 38–41, 63 | |
| `/app/bo-loc` | `pages/app/ScreenerPage.jsx` | 91–103, 105 | Bộ lọc theo sàn, ngành, vốn hoá, định giá |
| `/app/cai-dat` | `pages/app/SettingsPage.jsx` | 123–139, 141–142 | |
| `/app/cai-dat/huy-goi` | `pages/app/CancelMembershipPage.jsx` | 140 | |
| Lỗi / 404 | `pages/NotFoundPage.jsx` | 104 | |
| Toàn cục | `components/layout/*` | 9, 12, 21, 106–108, 129–135 | Dock, bảng lệnh ⌘K, tìm kiếm, phím tắt, góp ý |
