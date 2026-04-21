# HƯỚNG DẪN CHẠY VÀ BUILD APP MỚI NHẤT VỚI EXPO (iOS & Android)

Tài liệu này tổng hợp các cách chạy app tối ưu nhất tuỳ vào từng giai đoạn công việc, từ lúc kiểm thử nhanh mã nguồn đến lúc build file thực tế đưa lên App Store và Google Play.

---

## PHẦN 1: CÁCH CHẠY APP TỐI ƯU NHẤT (TUỲ TRƯỜNG HỢP)

Đừng lúc nào cũng chạy `eas build` ngay, vì mỗi lần build lên mây có thể tốn 30 phút xếp hàng. Hãy xem mình đang ở trường hợp nào:

### 🌟 Trường hợp 1: Chỉnh sửa Code Logic, Giao Diện (Tính năng khuyên dùng 99%)
Nếu bạn vừa chỉnh sửa logic tính toán, thay đổi chữ, hoặc chỉnh sửa file `.js`/`.json` thông thường, bạn **bảo đảm sử dụng tính năng Hot Reloading** của Expo:
- **Câu lệnh chạy:**
  ```bash
  npm start
  ```
- **Thao tác:** Sau khi hiện QR Code trong Terminal, bạn chỉ cần bấm **phím `i`** (để mở máy ảo lập tức trên Simulator iOS) hoặc **phím `a`** (nếu đang chạy máy ảo Android).
- **Kết quả:** Code tải cực nhanh, sửa code lưu lại (Ctrl + S) là ứng dụng trên máy ảo tự động cập nhật ngay trên màn hình.

### ⚙️ Trường hợp 2: Khi cài đặt thêm thư viện Native hoặc Sửa Setting Hệ Thống
Nếu bạn sửa `app.json`, sửa file Config cứng hoặc thêm 1 module yêu cầu quyền Camera/Thông báo phức tạp mà `npm start` hay báo lỗi không nhận: Bạn mới cần nén file lên mây để Build cấu trúc Native bằng EAS.
- **Lệnh build Test cho iOS (Simulator):**
  ```bash
  eas build --platform ios --profile simulator
  ```
  *Sau khi đợi 30 phút hệ thống báo Thành Công -> Chạy tiếp lệnh: `eas build:run -p ios`*

- **Lệnh build Test cho Android (Lấy link APK cài trực tiếp):**
  ```bash
  eas build --platform android --profile preview
  ```

---

## PHẦN 2: CHUẨN BỊ MÔI TRƯỜNG & KHẮC PHỤC LỖI TẠI MÁY MAC

**Những công cụ bắt buộc:** 
- Đã cài Node.js.
- Cài EAS CLI: `npm install -g eas-cli` -> Đăng nhập bằng `eas login`.

**Sửa lỗi máy ảo không hiện hoặc không nhận diện Xcode (Lỗi thường gặp)**:
Vui lòng gõ 2 lệnh sau và nhập mật khẩu máy tính của mình (Mac) để cấp quyền cho Terminal điều khiển Máy ảo iOS và Xcode:
```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```

---

## PHẦN 3: XUẤT FILE XỊN ĐỂ ĐƯA LÊN LIÊN QUAN APP STORE VÀ GOOGLE PLAY

Khi ứng dụng đã qua các bước kiểm thử gắt gao và bạn muốn nén lên chợ ứng dụng cho mọi người trên thế giới tải về:

**1. Cho iOS (Xuất chuẩn file `.ipa` - Bắt buộc có chứng chỉ 99$ Apple Developer):**
```bash
eas build --platform ios --profile production
```

**2. Cho Google Play (Xuất chuẩn file `.aab` - Mới nhất thay cho apk):**
```bash
eas build --platform android --profile production
```

---

## PHẦN 4: CÁC LỆNH "CHỮA CHÁY" CỨU HỘ KHI LỖI

- **Xoá thư mục code và xoá bộ nhớ đệm (Clean dọn dẹp dự án):**
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm start -- --clear
  ```
- **Kiểm tra trạng thái các bản build online của bạn có đang treo không:**
  ```bash
  eas build:list
  ```
