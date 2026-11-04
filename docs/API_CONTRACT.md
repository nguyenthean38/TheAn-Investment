# Nhịp — API Contract (v1)

Frontend gọi API qua `src/api/http.js`:
- Mặc định `VITE_USE_MOCK=true` chạy mock server ngay trong trình duyệt (`src/api/mock/server.js`).
- Khi có backend thật, đặt `VITE_USE_MOCK=false` và `VITE_API_URL=https://…/api/v1`.

## Quy ước chung

- **Header:** `Content-Type: application/json`; `Authorization: Bearer <token>` cho các endpoint cần đăng nhập (🔒).
- **Thành công:** `200/201 { "data": …, "meta"?: … }`, `204` khi không có nội dung.
- **Lỗi:** `4xx/5xx { "error": { "code": "VALIDATION|UNAUTHORIZED|NOT_FOUND|LIMIT|INTERNAL", "message": "…tiếng Việt…", "fields"?: { "<field>": "…" } } }`.
  - Frontend hiển thị `message` trực tiếp cho người dùng.
  - Gặp `401`, frontend xoá token và chuyển về `/dang-nhap`.
- **Đơn vị:**
  - Giá: **đồng** (số nguyên, đúng bước giá HOSE 10/50/100đ).
  - Vốn hoá và tài chính: **tỷ đồng**.
  - `shares`: **triệu cổ phiếu**.
  - Thời gian: **epoch ms**.
  - Tỷ lệ: phần trăm (`12.5` = 12,5%).
- **Khung thời gian `range`:** `1D | 1W | 1M | 3M | 6M | YTD | 1Y | 3Y`.

## Mô hình dữ liệu

```ts
User { id, email, name, createdAt, onboarded: boolean, interests: SectorId[],
       preferences: { hideHints, hideDock, newsletter, priceUnit: 'dong'|'k' } }

StockSnapshot {
  ticker, name, exchange: 'HOSE'|'HNX'|'UPCOM', sector: SectorId, sectorName, color,
  price, ref, ceil, floor, open, high, low, change, changePct, volume, value, avgVolume,
  marketCap, shares, pe, pb, ps, eps, bvps, roe, roa, grossMargin, netMargin, dividendYield, beta,
  revenueTTM, netIncomeTTM, revenueGrowth, epsGrowth, foreignOwnership, foreignRoom,
  high52, low52, perf1W, perf1M, perf3M, perf1Y, perfYTD, evEbitda
}
StockDetail = StockSnapshot & { profile: { founded, employees, hq, ceo, about } }
Bar { t, value, open?, high?, low?, volume, volatility? }

FinancialRow {            // quý (period "Q3/2026") hoặc năm ("2025")
  period, year, quarter?,
  revenue, cogs, grossProfit, grossMargin, sga, rnd, operatingIncome, interestExpense, interestIncome,
  pretax, tax, netIncome, netMargin, eps,
  cash, receivables, inventory, ppe, totalAssets, liabilities, debt, equity,
  cfo, capex, fcf, cfi, cff, dividendsPaid
}
Earnings { history: [{ period, reportDate, estEps, actualEps, epsSurprise, estRevenue, actualRevenue, revenueSurprise, beat, reaction }],
           next: { period, reportDate, estEps, estRevenue } }
Analysts { counts: { strong_buy, buy, hold, sell, strong_sell }, total, consensus,
           target: { low, median, high, upside },
           actions: [{ id, house, rating, prevRating, action: 'init'|'upgrade'|'downgrade'|'reiterate', target, prevTarget, date }] }
Insider { id, ticker, name, role, type: 'buy'|'sell', registered, executed, price, value, date, ownedAfter }
Event { id, ticker|null, name, color?, type: 'earnings'|'dividend'|'agm'|'listing'|'meeting'|'market',
        title, date, session: 'pre'|'post', done, estEps?, actualEps?, beat?, estRevenue?, actualRevenue? }
News { id, tickers: string[], title, summary, sentiment: 'positive'|'neutral'|'negative', source, sourceCount, publishedAt }
Watchlist { id, name, tickers: string[], createdAt }
Holding { id, ticker, quantity (bội số 10), avgPrice, createdAt }
ScreenerTemplate { id, name, filters: Filter[], sort: { key, dir } | null, createdAt }
Subscription { plan: 'trial'|'monthly'|'yearly', status: 'trialing'|'active'|'canceled', since, renewsAt }
```

## Endpoint

### Xác thực (magic link)
| Method | Path | Body | Trả về |
|---|---|---|---|
| POST | `/auth/magic-link` | `{ email }` | `{ sent, email }`. Gửi email chứa liên kết đăng nhập |
| POST | `/auth/verify` | `{ email, name? }`* | `{ token, user, isNew }` |
| POST | `/auth/demo` | — | `{ token, user }`. Tài khoản trình diễn |
| POST | `/auth/logout` 🔒 | — | 204 |
| GET | `/me` 🔒 | — | `User` |
| PATCH | `/me` 🔒 | `{ name?, onboarded?, interests?, preferences? }` | `User` |

\* Backend thật nên nhận `{ token }` từ liên kết trong email. Bản mock nhận email để mô phỏng.

### Thị trường
| Method | Path | Trả về |
|---|---|---|
| GET | `/market/overview` | `{ session: {code,label,open}, tradingDay, indices: IndexQuote[], breadth: {up,down,flat,ceil,floor}, mood: {id,label}, liquidity }` |
| GET | `/market/indices/:code/history?range=` | `Bar[]` (có `volatility` cho VNINDEX) |
| GET | `/market/sectors` | `[{ id, name, changePct, perf1M, marketCap, tickers }]` |
| GET | `/market/movers` | `{ gainers, losers, active }: StockSnapshot[]` |
| GET | `/market/foreign` | `{ net, topBuy, topSell, series: [{t, net}] }` |
| GET | `/market/global` | `{ indices, commodities: [{code,name,region,value,change,changePct,ytd,spark}] }` |
| GET | `/market/macro` | `{ outlook, yieldCurve: [{tenor,value,prev}], rates, events: [{id,date,title,country,impact,prev,forecast,actual,kind?}] }` |
| GET | `/market/insiders?type=buy|sell&limit=` | `Insider[]` (kèm `company`, `color`) |
| GET | `/market/recap` | `{ headline, generatedAt, highlights, sections: [{title, body}] }` |
| GET | `/news?ticker=&limit=` | `News[]` |
| GET | `/events` | `Event[]` (cửa sổ khoảng −45 → +90 ngày) |

### Cổ phiếu
| Method | Path | Trả về |
|---|---|---|
| GET | `/stocks` | `StockSnapshot[]`, `meta: { total, sectors }` |
| GET | `/stocks/search?q=&limit=` | `StockSnapshot[]`. Khớp mã, tên không dấu |
| GET | `/stocks/:ticker` | `StockDetail` |
| GET | `/stocks/:ticker/history?range=` | `Bar[]`. `1D` cho dữ liệu 5 phút trong phiên |
| GET | `/stocks/:ticker/financials` | `{ quarterly: FinancialRow[12], annual: FinancialRow[6] }` |
| GET | `/stocks/:ticker/earnings` | `Earnings` |
| GET | `/stocks/:ticker/analysts` | `Analysts` |
| GET | `/stocks/:ticker/insiders` | `Insider[]` |
| GET | `/stocks/:ticker/foreign` | `{ series: [{t,buy,sell,net}], ownership, room }` |
| GET | `/stocks/:ticker/peers?tickers=A,B` | `StockSnapshot[]`. Phần tử đầu là chính mã đó |

### Người dùng 🔒
| Method | Path | Body | Ghi chú |
|---|---|---|---|
| GET | `/watchlists` | — | `Watchlist[]` |
| POST | `/watchlists` | `{ name, tickers? }` | Tối đa 10 danh sách |
| PATCH | `/watchlists/:id` | `{ name?, tickers? }` | `tickers` theo thứ tự hiển thị (kéo thả) |
| DELETE | `/watchlists/:id` | — | |
| POST | `/watchlists/:id/items` | `{ ticker }` | |
| DELETE | `/watchlists/:id/items/:ticker` | — | |
| GET / POST | `/holdings` | `{ ticker, quantity, avgPrice }` | Lỗi `fields` nếu khối lượng không phải bội số 10 |
| PATCH / DELETE | `/holdings/:id` | | |
| GET / POST | `/screener/templates` | `{ name, filters, sort }` | |
| DELETE | `/screener/templates/:id` | | |
| GET | `/subscription` | | `Subscription` |
| PATCH | `/subscription` | `{ plan: 'monthly'|'yearly' }` | |
| POST | `/subscription/cancel`, `/subscription/resume` | | |
| GET / POST | `/referrals` | `{ emails: string[] }` | GET trả `{ code, list, freeMonths }` |
| POST | `/feedback` | `{ message, attachments? }` | |
