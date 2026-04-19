# Mobile App Development Tasks

Dưới đây là danh sách các tính năng cần được hoàn thành cho App Mobile Antigravity, tuân theo Kế hoạch triển khai đã được phê duyệt.

- [x] **Task 1: Cấu hình ban đầu & Dependencies**
  - Cài đặt `expo-av` (để chạy nhạc lofi offline), `expo-notifications` (thông báo đẩy).
  - Khởi tạo Auth Context / Store để quản lý State người dùng.

- [x] **Task 2: Xác thực mạng lưới (Auth Screen)**
  - Giao diện Đăng nhập / Đăng ký bằng Email & Mật khẩu thay thế Modal Web cũ.
  - Tích hợp `firebase/auth`.

- [x] **Task 3: Tính năng Nhạc Lofi Native**
  - Gắn file MP3 lofi tĩnh vào dự án (assets).
  - Tích hợp Trình phát nhạc nền bằng `expo-av`. Nút bật tắt ở Profile.

- [x] **Task 4: Màn hình Flashcard 3D & Swipe**
  - Bổ sung logic Reanimated xoay thẻ 3D.
  - Gắn PanGestureHandler vuốt (Tinder Swipe) sang trái (chưa thuộc) và phải (đã thuộc).

- [x] **Task 5: Màn hình Ôn tập ngắt quãng (Spaced Repetition)**
  - Giao diện Dashboard (số lượng thẻ Mới / Cần ôn / Đang học / Review).
  - Mở chức năng tính toán SM-2 này cho **mọi người dùng** thay vì chỉ Admin.
  - Sync cơ sở dữ liệu lên `firebase/database`.

- [x] **Task 6: Màn hình Quiz (Trắc nghiệm)**
  - Bộ câu hỏi động xáo trộn lấy từ `data.js`.
  - Phản hồi đúng/sai tức thì và Màn hình tổng kết (Summary).

- [x] **Task 7: Màn hình Thi Thử JLPT N2**
  - Chức năng thi 60 phút, đồng hồ đếm ngược.
  - Navigation tiến/lùi giữa các câu hỏi, bảng chấm điểm chẩn đoán lỗi sai.

- [x] **Task 8: Hệ thống Push Notification**
  - Chạy scrip lịch hẹn (Local Schedule Notification) hàng ngày dựa trên tổng số thẻ "Cần ôn" đến ngày hạn (due date).
