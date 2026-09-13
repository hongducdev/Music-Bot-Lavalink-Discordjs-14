# 🎵 Discord Music Bot (Lavalink + discord.js v14)

![Node.js 22+](https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white)
![TypeScript 7](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)
![discord.js v14](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)
![Lavalink v4](https://img.shields.io/badge/Lavalink-v4-9333EA)
![Java 17+](https://img.shields.io/badge/Java-17%2B-ED8B00?logo=openjdk&logoColor=white)
![tests: vitest](https://img.shields.io/badge/tests-vitest-6E9F18?logo=vitest&logoColor=white)

Bot nhạc cho Discord viết bằng TypeScript: **discord.js v14** + **Lavalink v4**, phát YouTube qua LavaSrc/yt-dlp. Dùng được cả slash command (`/`), prefix (`!`) và ping thẳng bot (`@Bot <lệnh>`).

## 📦 Yêu cầu

- Node.js 22+
- Java 17+ (chạy Lavalink v4 độc lập)
- Token bot + Application ID từ Discord Developer Portal

## 🚀 Cài đặt

```bash
npm install
cp .env.example .env
```

`.env` là **nơi duy nhất** chứa secret của dự án — đã bị git ignore, không bao giờ commit.

| Biến | Ý nghĩa |
|---|---|
| `DISCORD_TOKEN` | Token bot |
| `CLIENT_ID` | Application ID |
| `LAVALINK_PASSWORD` | Mật khẩu Lavalink — **đặt ngẫu nhiên**, đừng dùng `youshallnotpass` |
| `GUILD_ID` | (tuỳ chọn) deploy slash command tức thì trong 1 server |
| `PREFIX` | (tuỳ chọn) tiền tố lệnh text, mặc định `!` |
| `RPC_*` | (tuỳ chọn) Rich Presence — xem mục “RPC trên profile người nghe” bên dưới |
| `YT_OAUTH_REFRESH_TOKEN`, `SPOTIFY_*` | (tuỳ chọn) xem [docs/troubleshooting.md](docs/troubleshooting.md) |

`lavalink/application.yml` được commit vì chỉ đọc `${BIẾN}`, không chứa secret. Riêng `Lavalink.jar`, `yt-dlp.exe`, `lavalink/plugins/`, `lavalink/logs/` bị ignore — tự tải/tự tạo ở mục dưới.

## 🎧 Chạy Lavalink (không Docker)

1. Tải `Lavalink.jar` bản **4.2.2 trở lên** (bắt buộc — Discord yêu cầu giao thức voice DAVE).
2. Khởi động bằng script để secret từ `.env` được nạp:

   ```powershell
   .\lavalink\start.ps1
   ```

   > Đừng chạy `java -jar Lavalink.jar` trực tiếp — cách đó không nạp `.env` nên Lavalink dùng mật khẩu mặc định và bot báo 401. Script cũng chỉ cho Lavalink nghe ở `127.0.0.1`.

3. Tải `yt-dlp` (engine chính để phát YouTube, không có trong git) và cập nhật định kỳ khi YouTube đổi cơ chế:

   ```powershell
   Invoke-WebRequest "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -OutFile lavalink\yt-dlp.exe
   .\lavalink\yt-dlp.exe -U
   ```

## ▶️ Deploy & chạy

```bash
npm run deploy               # đăng ký slash command
npm run dev                  # dev (tự nạp TS)
npm run build && npm start   # production
npm test                     # unit test (vitest)
```

- `npm run deploy` mặc định deploy toàn cục (có thể mất tới 1 giờ mới hiện). Thêm `GUILD_ID` vào `.env` để có hiệu lực ngay, và script in ra **link mời bot kèm đủ quyền** ở cuối.
- Bot cần: **Xem kênh, Gửi tin nhắn, Nhúng liên kết** (kênh chat) + **Kết nối, Nói** (kênh thoại). Thiếu quyền thì `/play` báo rõ tên quyền còn thiếu. Ping bot cũng có nút **Mời bot** với đúng bộ quyền đó.

## 🎮 Danh sách lệnh

| Chức năng | Slash Command | Prefix Command | Viết tắt |
|---|---|---|---|
| Phát nhạc | `/play <query>` | `!play <query>` | `!p <query>` |
| Tạm dừng | `/pause` | `!pause` | - |
| Tiếp tục | `/resume` | `!resume` | - |
| Bỏ qua | `/skip` | `!skip` | `!s` |
| Xem hàng đợi | `/queue` | `!queue` | `!q` |
| Bài đang phát | `/nowplaying` | `!nowplaying` | `!np` |
| Tự động phát | `/autoplay <bat>` | `!autoplay on\|off` | `!ap` |
| Dừng & rời kênh | `/stop` | `!stop` | - |
| Kiểm tra ping | `/ping` | `!ping` | - |
| Thời tiết | `/weather <diadiem>` | `!weather <địa điểm>` | `!thoitiet <địa điểm>` |
| Trợ giúp | `/help [lenh]` | `!help [lenh]` | `!h` |
| RPC trên profile | `/rpc connect\|status\|disconnect` | `!rpc …` | - |

> `/help` đọc thẳng danh sách lệnh đang nạp trong bot nên lệnh mới tự xuất hiện, không cần sửa bảng này.

## ✨ Tính năng

### Giao diện Components V2

Toàn bộ phản hồi dùng container V2 với màu Discord blurple, tiêu đề tiếng Việt, các khối nội dung ngăn bằng separator và nút nằm trong thẻ. Thông báo lỗi dùng màu đỏ; phản hồi ngắn không chèn ảnh trang trí.

- **Đang phát:** ảnh bìa lớn, thời gian nghe/trực tiếp, người yêu cầu, âm lượng, lặp/autoplay, bài tiếp theo và điều khiển. `/nowplaying` và thông báo bắt đầu bài dùng cùng bố cục.
- **Hàng đợi:** bài hiện tại cạnh thumbnail, tối đa 10 bài tiếp theo bên dưới; tổng thời gian không cộng thời lượng vô hạn của radio.
- **Trợ giúp / radio / thông tin bot:** chia nhóm rõ ràng; radio có menu chọn đài, thông tin bot có nút mời.
- Thẻ phản ánh trạng thái lúc gửi; dùng `/nowplaying` để lấy trạng thái mới. Ảnh không hợp lệ được bỏ qua, không chặn nội dung chữ.

[Xem trước bố cục](plans/20260913-components-v2-rebuild/preview.html) dùng dữ liệu minh họa và ảnh thay thế, không phải ảnh chụp Discord. Tạo lại sau khi build bằng `node plans/20260913-components-v2-rebuild/preview.mjs`. Khởi động lại tiến trình bot để nạp UI mới; không cần đăng ký lại slash command.

### Thời tiết

`/weather diadiem:Hà Nội`, `!weather Hà Nội` hoặc `@Bot weather Hà Nội` hiển thị thời tiết hiện tại, cảm giác thực, độ ẩm, gió, dự báo 6 giờ tới và 7 ngày trong thẻ Components V2. Nhiều địa điểm trùng tên sẽ có menu chọn; chỉ người gọi lệnh được thay đổi thẻ. Slash trả lời riêng tư, prefix trả lời công khai nhưng không ping.

Giờ theo địa điểm, nhiệt độ °C, gió km/h; 💧 là xác suất mưa, không phải lượng mưa. Dữ liệu thiếu hiện “—”. Thẻ là ảnh chụp dữ liệu lúc gọi lệnh; gọi lại để cập nhật. Tìm địa danh chưa đúng thì thêm quốc gia (`Paris, France`).

Tham khảo cách dùng nguồn dữ liệu của [Overmorrow](https://github.com/hongducdev/Overmorrow); triển khai độc lập với [Open-Meteo](https://open-meteo.com/en/docs) và [GeoNames qua Geocoding API](https://open-meteo.com/en/docs/geocoding-api). Không cần API key cho endpoint miễn phí dành cho sử dụng phi thương mại; mỗi yêu cầu có timeout 10 giây. Không thêm dependency. Chạy `npm run deploy` và khởi động lại bot để nạp lệnh `/weather` mới.

### Ping bot

`/ping` và `!ping` hiển thị **Gateway heartbeat** (trung bình heartbeat của các shard) và **HTTP phản hồi** (thời gian gửi phản hồi đến khi nhận kết quả API, đo bằng `performance.now()`). HTTP gồm thời gian SDK xử lý/chờ rate limit và mạng; không phải ping Internet của người dùng. Heartbeat chưa có mẫu hợp lệ hiện “Chưa có dữ liệu”. Uptime là thời gian tiến trình Node.js đã chạy.

Gõ `@Bot` (ping trực tiếp, không kèm gì) để nhận thẻ thông tin: ping, thời gian hoạt động, số server/thành viên, prefix, tác giả — kèm nút **Mời bot**.

Ping bot thay được cho prefix (`@Bot play con cá con chim` = `!play con cá con chim`); ping kèm tên lệnh sai cũng trả về thẻ thông tin. Bot **bỏ qua** `@everyone`, `@here` và ping role, và ưu tiên xử lý tin nhắn có prefix như lệnh bình thường.

### Autoplay

Hết hàng đợi, bot lấy danh sách **mix (RD)** của bài vừa phát trên YouTube rồi chọn ngẫu nhiên một bài **chưa phát gần đây**; mix lỗi hoặc rỗng thì lùi về tìm theo tên kênh (nghệ sĩ) trên YouTube Music. Bot nhớ 30 bài gần nhất mỗi server nên không lặp bài cũ. **Mặc định BẬT**; tắt bằng `/autoplay bat:false` hoặc `!autoplay off`. Trạng thái chỉ trong bộ nhớ — restart bot sẽ về mặc định BẬT.

### RPC trên profile người nghe

Người dùng chạy `/rpc connect`, mở link riêng tư và cấp quyền bằng **đúng tài khoản gọi lệnh** (link hết hạn sau 5 phút; `!rpc connect` gửi link qua DM). Ai đã liên kết và đang ngồi cùng kênh voice với bot sẽ thấy Rich Presence của bài đang phát — tên bot hiện tại, tên bài, nghệ sĩ, thời gian và nút mở bài hát; người yêu cầu bài cũng thấy dù không ở trong voice.

Thiết lập một lần cho chủ bot:

1. Mở application có ID bằng `CLIENT_ID`, bật **Social SDK** và OAuth2 **Public Client**.
2. Đăng ký Redirect URL, rồi điền cùng giá trị vào `.env`: `RPC_REDIRECT_URI`, `RPC_HOST` (mặc định `127.0.0.1`), `RPC_PORT` (mặc định `8787`).
3. Reverse proxy HTTPS của domain đó về `http://127.0.0.1:8787`. Callback phải mở được từ trình duyệt **của người cấp quyền** — `http://127.0.0.1:8787/callback` chỉ tự thử được trên máy chạy bot. Không ghi query string callback vào access log (chứa authorization code).
4. Chạy `npm run deploy` rồi khởi động lại bot. Không cần client secret hay token tài khoản cá nhân.

Scope dùng là `openid sdk.social_layer_presence` ([tài liệu Social SDK](https://docs.discord.com/developers/discord-social-sdk/core-concepts/oauth2-scopes)); mã gateway tham khảo [Discord-OAuth2-RPC](https://github.com/aiko-chan-ai/Discord-OAuth2-RPC/tree/07ea5a6dc707b529a1eef5f3343224a40d1bcb42) — tích hợp PoC, Discord chưa bảo đảm hỗ trợ lâu dài.

- `/rpc status` kiểm tra kết nối, `/rpc disconnect` xoá phiên trong bot; thu hồi quyền tại Discord → Authorized Apps.
- Hết bài, stop, bot rời voice hoặc người nghe rời kênh sẽ xoá RPC cũ; cập nhật được gộp nên có thể trễ ~4 giây.
- Token chỉ giữ trong RAM, không refresh/reconnect — restart bot hoặc token hết hạn thì `/rpc connect` lại.
- Bỏ trống `RPC_REDIRECT_URI` để tắt; chưa cấp quyền thì nhạc vẫn phát bình thường.

### Tin nhắn tự xoá

Bot chỉ tự xoá tin nhắn **của chính nó** (khai báo ở `DELETE_AFTER`, `src/utils/embed.ts`): lỗi/cảnh báo và thông báo hết nhạc sau **20 giây**, card now-playing và `nowplaying` sau **2 phút**; các xác nhận lệnh, `/queue`, `/help` và thẻ thông tin khi ping bot được giữ lại. Lỗi khi xoá (bị xoá tay, mất quyền) được bỏ qua nên không làm sập bot.

## 🔧 Khắc phục sự cố

Chi tiết đầy đủ — test stream, danh sách client, OAuth YouTube, nguồn backup, Spotify — ở [docs/troubleshooting.md](docs/troubleshooting.md).

- Log Lavalink: `Get-Content lavalink\logs\spring.log -Tail 60`
- `Sign in to confirm you're not a bot` → bật OAuth trong `application.yml`, xác thực bằng **tài khoản phụ**, dán refresh token vào `.env`.
- YouTube từ chối stream → bot tự tìm bài tương tự trên SoundCloud và báo trong kênh.

---

Quy ước commit message và checklist trước khi commit: [CONTRIBUTING.md](CONTRIBUTING.md).
