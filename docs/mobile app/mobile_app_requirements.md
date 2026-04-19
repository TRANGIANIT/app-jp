# Yêu Cầu Chức Năng Ứng Dụng Mobile (Dựa trên Web App hiện tại)

Dưới đây là danh sách chi tiết các chức năng và yêu cầu kỹ thuật hiện có trên phiên bản Web của ứng dụng Antigravity - Thẻ Học Ngữ Pháp Tiếng Nhật. 
Hãy đọc kỹ và cho tôi biết bạn muốn **bổ sung thêm tính năng nào** hoặc **xóa bỏ/thay đổi tính năng nào** để phù hợp hơn với phiên bản Mobile App.

---

## 📸 1. Giao diện & Trải nghiệm chung (UI/UX)
- Giao diện chủ đề Nhật Bản với hiệu ứng hoa anh đào (Sakura drop) rơi trên màn hình.
- Nút bật/tắt nhạc nền thư giãn (hiện tích hợp qua YouTube API).
- Hệ thống thanh điều hướng dưới cùng (Bottom Navigation) với các tab: **Thẻ Học**, **Ôn Tập (Quiz)**, **Thi Thử (JLPT)**, và **Admin** (nếu có quyền).
- Hỗ trợ xem thông tin tài khoản (Avatar, Tên đăng nhập).
- Nút "Tải lại dữ liệu" (kiểu xóa cache trên web).

## 📇 2. Chức năng Thẻ Học (Flashcard)
- **Danh sách / Bộ lọc**: Lọc thẻ học theo Tuần và Bài học (Day). Lọc trạng thái (Chưa thuộc / Đã thuộc).
- **Mặt trước thẻ**: Hiển thị thẻ dạng 3D, với tiêu đề ngữ pháp và nhãn trạng thái từ.
- **Mặt sau thẻ (Khi chạm để lật)**: Hiển thị Ý nghĩa, Cách dùng, Ví dụ (tiếng Nhật, có Furigana) và Dịch nghĩa sang tiếng Việt.
- **Tương tác**: 
  - Vuốt thẻ sang trái (Vuốt Tinder) để đánh dấu **Chưa thuộc**.
  - Vuốt thẻ sang phải để đánh dấu **Đã thuộc**.
- **Chế độ đa phân quyền**: 
  - GUEST (Chưa đăng nhập): Chỉ học được "Ngày 1".
  - USER (Đã đăng nhập): Có thể học tất cả các ngày. Tiến độ được đồng bộ đám mây.
- **Tải ảnh thẻ (Export Image)**:
  - Khung ảnh thiết kế theo chuẩn màn dọc (9:16) phù hợp đăng TikTok/Facebook.
  - User phải "Xin cấp quyền" tải ảnh (Pending) và hệ thống nhắc nhở kết bạn facebook/tiktok tác giả.
  - Nút tải chỉ hiện cho User đã được duyệt hoặc Admin.

## 🎯 3. Chức năng Ôn Tập Trắc Nghiệm (Quiz)
- Tạo bài quiz động với thuật toán trộn câu hỏi từ kho dữ liệu. Mỗi câu có 4 đáp án (1 đúng, 3 sai).
- Bộ lọc bài quiz theo Tuần và Bài học.
- Hiển thị phản hồi ngay lập tức cho câu trả lời đúng/sai bằng màu sắc.
- Màn hình tổng kết cuối cùng: Hiện % điểm số, số câu đúng/sai, kỷ lục cao nhất của Chủ đề, và nút tiện ích để học lại câu sai hoặc khởi động lại.

## 📝 4. Chức năng Thi Thử (JLPT Mock Exam)
- Cung cấp đề thi với khoảng 20 câu hỏi, cấu trúc thời gian 60 phút.
- Giao diện phòng thi: Đồng hồ đếm ngược, thanh tiến trình (Progress Bar), thông tin số câu đã chọn / chưa chọn.
- Điều hướng: Có thể đi lùi (Câu trước), tiến (Câu tiếp) hoặc Nộp bài.
- **Kết quả thi**: Chấm điểm tự động và thống kê % đúng.
- Tổng hợp các điểm ngữ pháp cần cải thiện (Weak Grammars) dựa trên số câu trả lời sai.

## 🛡️ 5. Chức năng Quản Trị Hệ Thống (Admin Dashboard)
Chỉ hiển thị với tài khoản có `role: admin`:
- **Tab 1 - Quản lý người dùng**: Xem danh sách User, Email, Tổng lượt đăng nhập, số lượng thẻ đã học, quyền hạn Tải Ảnh (Approved/Pending/None) và Hoạt động cuối (Last login). Hỗ trợ Lọc & Sắp xếp.
- **Tab 2 - Ôn Tập Ngắt Quãng (Spaced Repetition System)**:
  - Bảng điều khiển nâng cao chia làm: Thẻ Mới, Cần Ôn Hôm Nay, Đang Học, Ôn Tập.
  - Khi học thẻ sẽ đánh giá độ ghi nhớ bằng 4 mức: ❌ Again (1 ngày), 😐 Hard (3 ngày), 😊 Good (7 ngày), 😃 Easy (21 ngày).
  - Thuật toán lên lịch SM-2 (tương tự Anki).
  - Tự động đồng bộ với Firebase thời gian thực.
  - (Sẽ cần đưa ra quyết định ở phiên bản mobile là chức năng này sẽ vẫn chỉ dành cho Admin, hay mở cho toàn bộ User).

## ☁️ 6. Cơ sở dữ liệu và Backend (Firebase)
- Đăng ký/Đăng nhập: Email & Password, Google, Facebook.
- Dữ liệu hoàn toàn đồng bộ với Firebase Realtime Database. Tiến độ (tiếng Nhật đã học) sẽ được lưu dựa trên User ID (My Progress).
- Codebase client-side tự động đọc data từ file tĩnh (`data.js`) kết hợp Firebase cho dữ liệu động.

---

> [!IMPORTANT]
> **Yêu cầu phản hồi từ bạn:**
> Trước khi tạo file cấu trúc và bắt đầu gen source code Mobile App, vui lòng cho tôi biết:
> 1. Có tính năng nào ở Web mà bạn muốn **BỎ ĐI** trên Mobile không? (VD: Nhấp vô xin quyền tải ảnh, admin quản lý user...).
> 2. Có tính năng mới nào bạn muốn **BỔ SUNG THÊM**? (VD: Splash screen, thông báo đẩy (Push Notifications) để nhắc học...).
> 3. Cơ chế Spaced Repetition (Ôn tập ngắt quãng) hiện chỉ dành cho Admin, bạn có muốn mở chức năng này ra cho **mọi người dùng** ở App Mobile không? 

Hãy xác nhận để tôi tiến hành lập kế hoạch triển khai (Implementation Plan)!
