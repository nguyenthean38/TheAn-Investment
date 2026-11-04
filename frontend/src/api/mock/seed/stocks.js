/**
 * Danh sách cổ phiếu mô phỏng. Giá/tài chính là DỮ LIỆU GIẢ LẬP để minh hoạ giao diện,
 * không phản ánh thị trường thật. Đơn vị giá: đồng; vốn hoá & tài chính: tỷ đồng.
 */
export const SECTORS = [
  { id: 'banking', name: 'Ngân hàng' },
  { id: 'realestate', name: 'Bất động sản' },
  { id: 'tech', name: 'Công nghệ' },
  { id: 'materials', name: 'Thép & Vật liệu' },
  { id: 'energy', name: 'Dầu khí & Năng lượng' },
  { id: 'retail', name: 'Bán lẻ' },
  { id: 'consumer', name: 'Hàng tiêu dùng' },
  { id: 'securities', name: 'Chứng khoán' },
  { id: 'industrials', name: 'Công nghiệp & Vận tải' },
  { id: 'chemicals', name: 'Hoá chất' },
  { id: 'utilities', name: 'Tiện ích' },
]

/** price: giá tham chiếu gần nhất; drift/vol: tham số sinh chuỗi giá; color: màu logo chữ. */
export const STOCKS = [
  { ticker: 'FPT', name: 'CTCP FPT', exchange: 'HOSE', sector: 'tech', price: 128400, shares: 1471, drift: 0.0011, vol: 0.017, color: '#f27024', founded: 1988, employees: 48000, hq: 'Hà Nội', ceo: 'Nguyễn Văn Khoa', about: 'Tập đoàn công nghệ hàng đầu Việt Nam với ba mảng chính: công nghệ (chuyển đổi số, phần mềm xuất khẩu), viễn thông và giáo dục. Doanh thu từ thị trường nước ngoài chiếm gần một nửa tổng doanh thu.' },
  { ticker: 'VCB', name: 'Ngân hàng TMCP Ngoại thương Việt Nam', exchange: 'HOSE', sector: 'banking', price: 91800, shares: 5589, drift: 0.0003, vol: 0.011, color: '#1f8a4c', founded: 1963, employees: 23000, hq: 'Hà Nội', ceo: 'Nguyễn Thanh Tùng', about: 'Ngân hàng có vốn hoá lớn nhất sàn chứng khoán Việt Nam, thế mạnh về thanh toán quốc tế, tài trợ thương mại và chất lượng tài sản dẫn đầu ngành.' },
  { ticker: 'TCB', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam', exchange: 'HOSE', sector: 'banking', price: 24850, shares: 7065, drift: 0.0006, vol: 0.016, color: '#e2231a', founded: 1993, employees: 11800, hq: 'Hà Nội', ceo: 'Jens Lottner', about: 'Ngân hàng tư nhân lớn với định hướng số hoá mạnh, tỷ lệ tiền gửi không kỳ hạn (CASA) thuộc nhóm cao nhất hệ thống.' },
  { ticker: 'MBB', name: 'Ngân hàng TMCP Quân đội', exchange: 'HOSE', sector: 'banking', price: 23400, shares: 6104, drift: 0.0005, vol: 0.015, color: '#1b3c8f', founded: 1994, employees: 18000, hq: 'Hà Nội', ceo: 'Phạm Như Ánh', about: 'Ngân hàng đa năng với hệ sinh thái tài chính gồm chứng khoán, bảo hiểm, tài chính tiêu dùng và ứng dụng ngân hàng số có lượng người dùng lớn.' },
  { ticker: 'ACB', name: 'Ngân hàng TMCP Á Châu', exchange: 'HOSE', sector: 'banking', price: 25300, shares: 4467, drift: 0.0003, vol: 0.012, color: '#0a4ea2', founded: 1993, employees: 13000, hq: 'TP. Hồ Chí Minh', ceo: 'Từ Tiến Phát', about: 'Ngân hàng bán lẻ tập trung vào khách hàng cá nhân và doanh nghiệp vừa và nhỏ, nổi tiếng với quản trị rủi ro thận trọng.' },
  { ticker: 'BID', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', exchange: 'HOSE', sector: 'banking', price: 45150, shares: 6995, drift: 0.0001, vol: 0.013, color: '#006b68', founded: 1957, employees: 28000, hq: 'Hà Nội', ceo: 'Lê Ngọc Lâm', about: 'Ngân hàng thương mại nhà nước có tổng tài sản thuộc nhóm lớn nhất, mạng lưới chi nhánh phủ khắp cả nước.' },
  { ticker: 'VHM', name: 'CTCP Vinhomes', exchange: 'HOSE', sector: 'realestate', price: 42600, shares: 4354, drift: -0.0002, vol: 0.021, color: '#b5893a', founded: 2008, employees: 6500, hq: 'Hà Nội', ceo: 'Phạm Thiếu Hoa', about: 'Nhà phát triển bất động sản nhà ở lớn nhất Việt Nam với các đại đô thị quy mô hàng trăm hecta tại Hà Nội, TP. Hồ Chí Minh và các tỉnh.' },
  { ticker: 'VIC', name: 'Tập đoàn Vingroup', exchange: 'HOSE', sector: 'realestate', price: 41850, shares: 3824, drift: -0.0001, vol: 0.022, color: '#c8102e', founded: 1993, employees: 40000, hq: 'Hà Nội', ceo: 'Nguyễn Việt Quang', about: 'Tập đoàn đa ngành hoạt động trong bất động sản, công nghiệp (ô tô điện), thương mại dịch vụ và công nghệ.' },
  { ticker: 'KDH', name: 'CTCP Đầu tư và Kinh doanh Nhà Khang Điền', exchange: 'HOSE', sector: 'realestate', price: 33200, shares: 1011, drift: 0.0002, vol: 0.018, color: '#2e7d32', founded: 2001, employees: 400, hq: 'TP. Hồ Chí Minh', ceo: 'Vương Văn Minh', about: 'Chủ đầu tư nhà ở thấp tầng tại khu Đông TP. Hồ Chí Minh với quỹ đất sạch pháp lý và đòn bẩy thấp.' },
  { ticker: 'HPG', name: 'CTCP Tập đoàn Hoà Phát', exchange: 'HOSE', sector: 'materials', price: 26750, shares: 6396, drift: 0.0004, vol: 0.019, color: '#0d47a1', founded: 1992, employees: 32000, hq: 'Hà Nội', ceo: 'Nguyễn Việt Thắng', about: 'Nhà sản xuất thép lớn nhất Đông Nam Á, chiếm khoảng một phần ba thị phần thép xây dựng trong nước; đang mở rộng khu liên hợp Dung Quất 2.' },
  { ticker: 'HSG', name: 'CTCP Tập đoàn Hoa Sen', exchange: 'HOSE', sector: 'materials', price: 18450, shares: 616, drift: -0.0003, vol: 0.024, color: '#d81b60', founded: 2001, employees: 7500, hq: 'Bình Dương', ceo: 'Vũ Văn Thanh', about: 'Doanh nghiệp tôn mạ hàng đầu với hệ thống phân phối bán lẻ rộng và tỷ trọng xuất khẩu lớn.' },
  { ticker: 'GAS', name: 'Tổng Công ty Khí Việt Nam', exchange: 'HOSE', sector: 'energy', price: 68900, shares: 2343, drift: 0.0001, vol: 0.013, color: '#0057a8', founded: 1990, employees: 3500, hq: 'TP. Hồ Chí Minh', ceo: 'Phạm Văn Phong', about: 'Doanh nghiệp đầu ngành khí, sở hữu hệ thống đường ống, kho cảng LNG và chiếm phần lớn thị phần khí khô trong nước.' },
  { ticker: 'PLX', name: 'Tập đoàn Xăng dầu Việt Nam', exchange: 'HOSE', sector: 'energy', price: 39400, shares: 1271, drift: -0.0001, vol: 0.014, color: '#004a99', founded: 1956, employees: 26000, hq: 'Hà Nội', ceo: 'Đào Nam Hải', about: 'Nhà phân phối xăng dầu lớn nhất cả nước với hơn 5.500 cửa hàng bán lẻ.' },
  { ticker: 'MWG', name: 'CTCP Đầu tư Thế Giới Di Động', exchange: 'HOSE', sector: 'retail', price: 61200, shares: 1462, drift: 0.0008, vol: 0.02, color: '#ffcb05', founded: 2004, employees: 60000, hq: 'TP. Hồ Chí Minh', ceo: 'Vũ Đăng Linh', about: 'Nhà bán lẻ đa ngành với các chuỗi điện thoại, điện máy và bách hoá; mảng bách hoá đang là động lực tăng trưởng chính.' },
  { ticker: 'PNJ', name: 'CTCP Vàng bạc Đá quý Phú Nhuận', exchange: 'HOSE', sector: 'retail', price: 95600, shares: 338, drift: 0.0005, vol: 0.015, color: '#a01d26', founded: 1988, employees: 8000, hq: 'TP. Hồ Chí Minh', ceo: 'Lê Trí Thông', about: 'Thương hiệu trang sức hàng đầu với hơn 400 cửa hàng, dẫn đầu phân khúc trang sức tầm trung.' },
  { ticker: 'VNM', name: 'CTCP Sữa Việt Nam', exchange: 'HOSE', sector: 'consumer', price: 62300, shares: 2090, drift: -0.0002, vol: 0.01, color: '#0033a0', founded: 1976, employees: 10000, hq: 'TP. Hồ Chí Minh', ceo: 'Mai Kiều Liên', about: 'Doanh nghiệp sữa lớn nhất Việt Nam, sở hữu hệ thống trang trại bò sữa và mạng lưới phân phối phủ toàn quốc, xuất khẩu tới hơn 60 quốc gia.' },
  { ticker: 'MSN', name: 'CTCP Tập đoàn Masan', exchange: 'HOSE', sector: 'consumer', price: 74500, shares: 1438, drift: 0.0006, vol: 0.021, color: '#e4002b', founded: 2004, employees: 40000, hq: 'TP. Hồ Chí Minh', ceo: 'Danny Le', about: 'Tập đoàn tiêu dùng – bán lẻ với hệ sinh thái gồm hàng tiêu dùng, chuỗi bán lẻ, chế biến thịt và khai khoáng.' },
  { ticker: 'SAB', name: 'Tổng CTCP Bia – Rượu – Nước giải khát Sài Gòn', exchange: 'HOSE', sector: 'consumer', price: 51800, shares: 1283, drift: -0.0004, vol: 0.012, color: '#b71c1c', founded: 1875, employees: 8000, hq: 'TP. Hồ Chí Minh', ceo: 'Neo Gim Siong Bennett', about: 'Nhà sản xuất bia lớn nhất Việt Nam với các thương hiệu quen thuộc, tỷ suất lợi nhuận cao và lượng tiền mặt dồi dào.' },
  { ticker: 'SSI', name: 'CTCP Chứng khoán SSI', exchange: 'HOSE', sector: 'securities', price: 25600, shares: 1966, drift: 0.0005, vol: 0.022, color: '#c62828', founded: 1999, employees: 1500, hq: 'TP. Hồ Chí Minh', ceo: 'Nguyễn Hồng Nam', about: 'Công ty chứng khoán có vốn điều lệ và thị phần môi giới thuộc nhóm dẫn đầu, mạnh về khách hàng tổ chức và ngân hàng đầu tư.' },
  { ticker: 'VND', name: 'CTCP Chứng khoán VNDIRECT', exchange: 'HOSE', sector: 'securities', price: 15200, shares: 1522, drift: -0.0002, vol: 0.025, color: '#e65100', founded: 2006, employees: 1200, hq: 'Hà Nội', ceo: 'Phạm Minh Hương', about: 'Công ty chứng khoán tập trung vào nhà đầu tư cá nhân với nền tảng giao dịch trực tuyến phổ biến.' },
  { ticker: 'SHS', name: 'CTCP Chứng khoán Sài Gòn – Hà Nội', exchange: 'HNX', sector: 'securities', price: 12800, shares: 813, drift: 0.0002, vol: 0.028, color: '#00695c', founded: 2007, employees: 400, hq: 'Hà Nội', ceo: 'Lê Đăng Khoa', about: 'Công ty chứng khoán niêm yết trên sàn HNX, hoạt động chính là tự doanh và môi giới.' },
  { ticker: 'GMD', name: 'CTCP Gemadept', exchange: 'HOSE', sector: 'industrials', price: 63400, shares: 414, drift: 0.0004, vol: 0.017, color: '#00838f', founded: 1990, employees: 3000, hq: 'TP. Hồ Chí Minh', ceo: 'Nguyễn Thanh Bình', about: 'Doanh nghiệp khai thác cảng biển và logistics với hệ thống cảng nước sâu tại Hải Phòng và Bà Rịa – Vũng Tàu.' },
  { ticker: 'VJC', name: 'CTCP Hàng không Vietjet', exchange: 'HOSE', sector: 'industrials', price: 103500, shares: 542, drift: 0.0001, vol: 0.014, color: '#e30613', founded: 2007, employees: 6000, hq: 'Hà Nội', ceo: 'Đinh Việt Phương', about: 'Hãng hàng không thế hệ mới với mạng bay nội địa và quốc tế rộng khắp châu Á – Thái Bình Dương.' },
  { ticker: 'DGC', name: 'CTCP Tập đoàn Hoá chất Đức Giang', exchange: 'HOSE', sector: 'chemicals', price: 112000, shares: 380, drift: 0.0007, vol: 0.02, color: '#6a1b9a', founded: 1963, employees: 2000, hq: 'Hà Nội', ceo: 'Đào Hữu Huyền', about: 'Nhà sản xuất phốt pho vàng và hoá chất tinh khiết, biên lợi nhuận cao nhờ chủ động nguồn quặng.' },
  { ticker: 'POW', name: 'Tổng Công ty Điện lực Dầu khí Việt Nam', exchange: 'HOSE', sector: 'utilities', price: 12350, shares: 2342, drift: 0.0002, vol: 0.016, color: '#1565c0', founded: 2007, employees: 2500, hq: 'Hà Nội', ceo: 'Lê Như Linh', about: 'Doanh nghiệp phát điện với các nhà máy nhiệt điện khí, than và thuỷ điện; đang triển khai dự án điện khí LNG Nhơn Trạch 3 & 4.' },
  { ticker: 'REE', name: 'CTCP Cơ Điện Lạnh', exchange: 'HOSE', sector: 'utilities', price: 67800, shares: 471, drift: 0.0004, vol: 0.013, color: '#0277bd', founded: 1977, employees: 3000, hq: 'TP. Hồ Chí Minh', ceo: 'Huỳnh Thanh Hải', about: 'Doanh nghiệp đa ngành với mảng điện (thuỷ điện, năng lượng tái tạo), nước sạch, bất động sản cho thuê và cơ điện lạnh.' },
]

/** Chỉ số thị trường hiển thị trên bảng điều khiển. */
export const INDICES = [
  { code: 'VNINDEX', name: 'VN-Index', value: 1286.4, drift: 0.0003, vol: 0.009 },
  { code: 'VN30', name: 'VN30', value: 1342.7, drift: 0.0003, vol: 0.01 },
  { code: 'HNXINDEX', name: 'HNX-Index', value: 231.6, drift: 0.0001, vol: 0.011 },
  { code: 'UPCOM', name: 'UPCoM', value: 95.2, drift: 0.0001, vol: 0.007 },
]
