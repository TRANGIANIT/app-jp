# Kế Hoạch Triển Khai App Mobile Antigravity 📱

Dự án này sẽ chuyển đổi Web App Antigravity hiện tại thành một ứng dụng Mobile Native bằng **React Native (Expo)**, đồng thời đáp ứng các cập nhật mới nhất từ người dùng (Thêm Splash Screen, Push Notifications, mở rộng SR cho mọi users, loại bỏ luồng duyệt quyền tải ảnh).

## User Review Required

> [!IMPORTANT]
> Vui lòng phản hồi xem bạn có đồng ý với lộ trình triển khai và lựa chọn công nghệ (*Expo, Reanimated 3, AsyncStorage, Firebase*) dưới đây không. 

## Proposed Changes

### 1. Kiến Trúc & Công Nghệ (Tech Stack)
- **Framework**: Expo / React Native.
- **Navigation**: React Navigation (Bottom Tabs cho các tính năng chính, Stack cho Auth/Splash).
- **Animation**: `react-native-reanimated` & `react-native-gesture-handler` để làm hiệu ứng 3D Flashcard, Tinder Swipe, và lá Sakura rơi mượt mà (Native Thread).
- **State/Storage**: Zustand (hoặc React Context) kết hợp `AsyncStorage` để cache dữ liệu offline.
- **Backend (Firebase)**: Sử dụng lại hệ thống rules và database của project Firebase Web hiện tại (`firebase/auth`, `firebase/database`).
- **Push Notifications**: Sử dụng `expo-notifications` hỗ trợ lên lịch cục bộ (Local Scheduling) tự động thông báo khi có lượng thẻ đến hạn ôn tập (Spaced Rep).

---
### Thư mục / Cấu trúc code nội bộ (src) dự kiến:

#### [NEW] Màn hình chờ & Xác thực (Splash & Auth)
- `src/screens/SplashScreen.js`: Hiển thị Logo, hiệu ứng đơn giản, kiểm tra trạng thái login ngầm & tải `data.js`.
- `src/screens/AuthScreen.js`: Giao diện Login/Register thay thế cho Modal trên Web.

#### [NEW] Thanh điều hướng chính (Bottom Tab Navigation)
1. **Flashcard Tab** (`src/screens/FlashcardScreen.js`): Thay thế cho Flashcard View. Giữ nguyên hiệu ứng Tinder Swipe + Flip. Thêm nút "Lưu ảnh thẻ" gốc (tải thẳng vào cuộn camera không cần xin duyệt).
2. **Spaced Repetition Tab** (`src/screens/SpacedRepScreen.js`): Mở cho **MỌI NGƯỜI DÙNG**. Giao diện Dashboard gồm 4 thẻ (Mới, Cần ôn, Đang học, Ôn tập) và màn hình thao tác 4 nút (Again/Hard/Good/Easy).
3. **Quiz Tab** (`src/screens/QuizScreen.js`): Trắc nghiệm chọn 4 đáp án theo tuần/ngày.
4. **JLPT Tab** (`src/screens/JLPTExamScreen.js`): Màn hình thi thử 60 phút, thanh Progress Bar, tính điểm.
5. **Profile / Admin Tab** (`src/screens/ProfileScreen.js`): Nút đổi/tắt nhạc lofi, đăng xuất, thống kê cơ bản. Phần quản lý User list chỉ hiện nếu role === 'admin'.

#### [MODIFY] Dữ liệu nguồn tĩnh (Data core)
- Chuyển đổi file tĩnh `data.js` hiện tại của web thành module JS (`src/data/flashcards.js`) và `src/utils/spacedRepetitionEngine.js`. Tích hợp hoàn toàn offline first.

---
### 2. Các Bước Triển Khai (Execution Steps)

**Giai đoạn 1: Khởi tạo & Định tuyến (Navigation)**
- Khởi tạo Expo App (Thư mục `/Users/locnm/Downloads/Code/antigravity ok/mobile/`).
- Import data tĩnh và cấu hình React Navigation. 
- Xây dựng Splash Screen.

**Giai đoạn 2: UI Lõi (Component)**
- Viết Component thẻ `Flashcard` 3D xoay, tích hợp Reanimated Swipe.
- Chế độ Sakura background.

**Giai đoạn 3: Tích hợp hệ thống & Firebase**
- Gắn Firebase Config (từ file script.js Web sang Expo).
- Sync "My Progress" và tiến trình "Spaced Repetition".

**Giai đoạn 4: Push Notifications & Media**
- Thêm Expo Notifications: Tự động lên lịch hẹn push thông báo nếu trong bảng DB Spaced Rep có thẻ Due Date là hôm nay.
- Thay thế Youtube Iframe bằng thư viện Audio API của Expo (`expo-av`) hoặc duy trì youtube hidden webview. Thay vì tự phát youtube ngầm (rất hay bị chặn trên mobile), dùng Native Audio chạy file Lofi tích hợp thẳng vào app.
- Xây dựng luồng tải ảnh dùng `react-native-view-shot` và `expo-media-library`.

## Open Questions

> [!WARNING]
> 1. **Về nhạc nền Lofi**: Bạn có muốn tải 1 bài lofi MP3 dọng sẵn vào App thay vì dùng YouTube Iframe không? (Native audio nhẹ hơn, ổn định hơn và ít tốn pin, còn Youtube Iframe chạy ngầm đôi khi bị App Store từ chối duyệt).
> 2. Đăng nhập Social (Google/FB) trên Web dùng Popup, trên Expo cần set config native OAuth hơi tốn thời gian. Bạn có muốn làm luồng Email/Password trước cho MVP không, hay bắt buộc phải có Google/FB ngay bây giờ?

## Verification Plan

### Automated Tests
- Kiểm tra lại công thức SM-2 đảm bảo Interval tính đúng ngày theo format JS Date.

### Manual Verification
- Bạn (User) cài ứng dụng Expo Go trên điện thoại thật.
- Quét mã QR QR để trải nghiệm thực tế hiệu ứng vuốt Tinder Swipe và màn hình JLPT.
- Thử nghiệm việc lưu một thẻ flashcard thành hình ảnh thẳng vào Photos/Gallery của điện thoại.
- Kiểm tra tính năng nhận thông báo Push Notification ngầm (kể cả khi tắt app hoàn toàn).
