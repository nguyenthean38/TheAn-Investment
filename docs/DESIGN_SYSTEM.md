# Nhịp — Design System

Tài liệu này mô tả nền tảng giao diện của Nhịp: token, thành phần dùng chung và quy ước dữ liệu. Mục tiêu là để frontend và backend nói chung một "ngôn ngữ".

## 1. Nguyên tắc

1. **Nền tối trung tính, màu dành cho dữ liệu.** Bề mặt chỉ dùng thang xám gần đen. Màu sắc mạnh được giữ cho tín hiệu thị trường: tăng, giảm, trần, sàn, tham chiếu.
2. **Đúng quy ước thị trường Việt Nam.**
   - Giá được tô màu theo bảng điện: trần **tím**, sàn **xanh lơ**, tham chiếu **vàng**, tăng xanh lá, giảm đỏ.
   - Số viết theo `vi-VN` (128.400 · +1,25%).
3. **Bàn phím là công dân hạng nhất.** Mọi trang mở được bằng phím tắt. Có bảng lệnh ⌘K, và mỗi mục quan trọng có gợi ý `Kbd`.
4. **Ít khung, nhiều nhịp.** Thẻ bo góc lớn (18px), viền 1px rất mảnh, khoảng trắng rộng. Hiệu ứng ngắn (≤ 260ms).
5. **Tiếng Việt trước tiên.**
   - Font Be Vietnam Pro.
   - Không dùng `leading-none` cho chữ có dấu.
   - `letter-spacing` tối đa 0.04em.

## 2. Token màu (`src/styles/index.css` → `@theme`)

| Nhóm | Token | Giá trị | Dùng cho |
|---|---|---|---|
| Bề mặt | `canvas` | `#09090b` | Nền trang |
| | `base` | `#0e0e11` | Ô nhập, nền thanh phân đoạn |
| | `surface` | `#131317` | Thẻ (`card`) |
| | `raised` | `#1a1a1f` | Dock, bảng lệnh, popover |
| | `overlay` / `hover` | `#222228` / `#26262d` | Trạng thái chọn / hover |
| Viền | `line` / `line-strong` | `#232329` / `#2f2f37` | Viền thẻ / viền điều khiển |
| Chữ | `fg` / `dim` / `muted` / `faint` | `#f3f3f4` → `#56565f` | 4 cấp nhấn mạnh |
| Thương hiệu | `brand-soft` / `brand` / `brand-deep` | `#ffd3ad` / `#ffa36c` / `#e9724c` | Gradient "bình minh", focus ring, trạng thái bật |
| Thị trường | `up` | `#2fd28a` | Tăng giá |
| | `down` | `#ff5a6a` | Giảm giá |
| | `ref` | `#f2c94c` | Giá tham chiếu |
| | `ceil` | `#c084fc` | Giá trần |
| | `floor` | `#38bdf8` | Giá sàn |
| Chuỗi dữ liệu | `series-1…6` | trắng, cam, tím, xanh lơ, hồng, xanh chanh | Biểu đồ nhiều đường |

## 3. Typography

- **Font:**
  - **Be Vietnam Pro** (400/500/600/700) cho toàn bộ giao diện.
  - **JetBrains Mono** (500) cho phím tắt `Kbd`.
  - Mọi con số dùng `font-feature-settings: 'tnum'` (utility `num`), để các cột số thẳng hàng.

| Utility | Kích thước | Dùng cho |
|---|---|---|
| `ds-display` | clamp(2.4–4.6rem) / 700 | Hero trang giới thiệu |
| `ds-h1` | 28px / 700 | Tiêu đề trang |
| `ds-h2` | 20px / 600 | Tiêu đề mục, modal |
| `ds-h3` | 16px / 600 | Tiêu đề thẻ |
| `ds-label` | 11.5px / 500 / UPPERCASE | Nhãn nhóm |
| `ds-caption` | 12px | Chú thích, nhãn chỉ số |
| `text-gradient` | — | Tiêu đề nhấn (gradient thương hiệu) |

## 4. Thành phần dùng chung

**`components/ui`:**
- `Button`: biến thể primary (viên thuốc trắng), brand, secondary, outline, ghost, danger, link. Dùng `IconButton` cho nút chỉ có icon.
- Nhập liệu:
  - `Input`, `Textarea` (có label, error, hint).
  - `Toggle`, `Checkbox`, `RadioCard`.
- Hiển thị:
  - Nhãn và phím: `Kbd`, `KeySeq` ("G rồi H"), `Chip`.
  - Giá và biến động: `ChangePill`, `ChangeText`, `PriceText` (tô màu theo trần/sàn/tham chiếu với `priceTone()`).
  - Mã cổ phiếu: `TickerLogo`, `TickerCell`, `ExchangeBadge`.
  - Chỉ số: `TickMeter` (thang vạch), `Metric`, `StatRow`.
- Điều hướng trong trang: `Segmented` (khung thời gian), `Tabs` (gạch chân).
- Khung nội dung: `Card`, `SectionHeader` (tiêu đề + phím tắt + hành động).
- Trạng thái: `Skeleton`, `Spinner`, `EmptyState`, `ErrorState`, `Tooltip`.
- Lớp phủ:
  - `Modal`, `Drawer`, `Popover`.
  - Tất cả khoá cuộn trang, đóng bằng `Esc` và trả lại focus.
- Thông báo và nhận diện: `Toaster`, `Logo`, `LogoMark`.

**`components/charts`** (SVG tự viết, không thư viện):
- `LineChart`: nhiều đường, vùng tô, đường tham chiếu nét đứt, cột khối lượng, biểu đồ phụ, chế độ `normalize` (%), crosshair và tooltip.
- `BarChart`: cột nhóm, hỗ trợ giá trị âm, cột dự phóng nét đứt.
- `Sparkline`.

**`components/layout`:**
- `AppLayout`: bảo vệ đăng nhập và onboarding, phím tắt toàn cục, cuộn tới `#hash`.
- `AppHeader`, `MarketStatus`.
- `Dock`: thanh điều hướng nổi kèm nút tìm kiếm tròn.
- `CommandPalette`: ô nhập ở đáy, nhóm kết quả, điều hướng bằng ↑ ↓ ↵.
- `FeedbackPanel`, `ShortcutsDrawer`, `WatchPanel`.

## 5. Mẫu tương tác

| Mẫu | Mô tả |
|---|---|
| Phím tắt toàn cục | `Ctrl/⌘ K` bảng lệnh · `/` tìm mã · `?` phím tắt · `W` danh sách theo dõi · `G` rồi `H/A/C/W/G/S/,` chuyển trang |
| Phím tắt trang cổ phiếu | `B` theo dõi · `[` `]` đổi khung thời gian · `A/E/F/P` nhảy tới mục |
| Gợi ý | Lần đầu bấm dock tới một trang, hiện toast "Mẹo: lần sau nhấn G rồi …". Tắt được trong Cài đặt |
| Toast | Viên thuốc ở giữa phía trên, tự ẩn sau 3,6 giây |
| Lựa chọn nhiều | Checkbox xuất hiện → thanh hành động nổi ở đáy (thay vị trí dock) |
| Trạng thái rỗng | Icon trong ô bo góc có quầng sáng thương hiệu + mô tả + 1 hành động |

## 6. Định dạng dữ liệu (`utils/format.js`)

| Hàm | Ví dụ | Ghi chú |
|---|---|---|
| `formatPrice` | `128.400` | Giá cổ phiếu tính bằng đồng |
| `formatPercent` | `+1,25%` | Luôn có dấu |
| `formatChange` | `+1.200` | |
| `formatBillion` | `184,6 nghìn tỷ` | Đầu vào là **tỷ đồng** |
| `formatVolume` | `1,2 tr` | |
| `formatPoint` | `1.286,42` | Điểm chỉ số |
| `formatLongDate` | `Thứ ba, 4 tháng 11` | |
| `timeAgo` | `12 phút trước` | |

## 7. Quy ước cho backend

- Phản hồi dạng `{ data, meta? }`. Lỗi dạng `{ error: { code, message, fields? } }`, trong đó `message` là tiếng Việt và hiển thị trực tiếp cho người dùng.
- Đơn vị:
  - Giá tính bằng **đồng** (số nguyên, đúng bước giá).
  - Vốn hoá và số liệu tài chính tính bằng **tỷ đồng**.
  - Số cổ phiếu tính bằng **triệu cổ phiếu**.
  - Thời gian là **epoch ms**.
- Đặc tả đầy đủ: [API_CONTRACT.md](./API_CONTRACT.md). Danh sách màn hình: [SCREEN_MAP.md](./SCREEN_MAP.md).
