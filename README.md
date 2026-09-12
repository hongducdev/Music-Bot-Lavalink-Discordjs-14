# Discord Music Bot (Lavalink + discord.js v14)

Bot Discord nghe nhạc bằng TypeScript, dùng **discord.js v14** và **Lavalink v4** (hỗ trợ phát nhạc từ YouTube qua Lavalink source).

## 1. Yêu cầu hệ thống

- Node.js 22+
- Java 17+ (để chạy Lavalink v4 độc lập)
- Token bot Discord và Application ID từ Discord Developer Portal

## 2. Cài đặt

```bash
npm install
cp .env.example .env
cp lavalink/application.example.yml lavalink/application.yml
```

Cập nhật các biến trong `.env`:
- `DISCORD_TOKEN`: Token bot Discord.
- `CLIENT_ID`: Application ID của bot.
- `GUILD_ID` (tuỳ chọn): deploy lệnh tức thì trong 1 server.
- `PREFIX`: tiền tố lệnh text (mặc định `!`).
- `LAVALINK_PASSWORD`: mật khẩu Lavalink — **hãy đặt ngẫu nhiên**, đừng dùng `youshallnotpass`.
- `YT_OAUTH_REFRESH_TOKEN`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` (tuỳ chọn).

### File nào bị git bỏ qua?
`.env` là **nơi duy nhất** chứa bí mật của dự án — đã bị git ignore, không bao giờ commit.

| File | Trạng thái |
|---|---|
| `.env` | 🔒 bị ignore — chứa mọi secret |
| `.env.example` | ✅ commit — bản mẫu |
| `lavalink/application.yml` | ✅ commit — chỉ có `${BIẾN}`, **không chứa secret** |
| `lavalink/Lavalink.jar`, `lavalink/yt-dlp.exe` | 🚫 ignore — tự tải, xem mục 3 |
| `lavalink/plugins/`, `lavalink/logs/` | 🚫 ignore — Lavalink tự tạo |
| `package.json`, `tsconfig.json`, `package-lock.json` | ✅ commit — giống nhau trên mọi máy |

`lavalink/application.yml` đọc secret từ biến môi trường dạng `${LAVALINK_PASSWORD:...}`, nên an toàn để commit.

## 3. Chạy Lavalink độc lập (không Docker)

1. Tải file `Lavalink.jar` (bản **4.2.2 trở lên** — bắt buộc, vì Discord yêu cầu giao thức voice DAVE) từ trang phát hành Lavalink.
2. **Khởi động bằng script** để secret từ `.env` được nạp:

```powershell
.\lavalink\start.ps1
```

> ⚠️ Đừng chạy `java -jar Lavalink.jar` trực tiếp — cách đó **không** nạp `.env`, Lavalink sẽ dùng mật khẩu mặc định và bot không kết nối được.
>
> Script cũng đặt `address: 127.0.0.1` nên Lavalink chỉ nghe trong máy, không lộ ra mạng ngoài.

### yt-dlp (engine chính cho YouTube)
Lavalink dùng plugin LavaSrc + `yt-dlp.exe` để phát YouTube. File này **không có trong git**, phải tự tải:

```powershell
Invoke-WebRequest "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -OutFile lavalink\yt-dlp.exe
```

Yt-dlp phải được cập nhật định kỳ khi YouTube đổi cơ chế:

```powershell
.\lavalink\yt-dlp.exe -U
```

## 4. Deploy slash command

Đăng ký danh sách lệnh Slash lên Discord:

```bash
npm run deploy
```

Mặc định deploy **toàn cục** (Discord có thể mất tới 1 giờ mới hiển thị). Muốn cập nhật **tức thì** trong một server, thêm `GUILD_ID` vào `.env`:

```env
GUILD_ID=123456789012345678
```

Script cũng in ra **link mời bot kèm đủ quyền** ở cuối — dùng link đó để mời bot thay vì tự chọn quyền.

### Quyền bot cần
| Phạm vi | Quyền |
|---|---|
| Kênh chat | Xem kênh, Gửi tin nhắn, Nhúng liên kết |
| Kênh thoại | Kết nối, Nói |

Nếu thiếu quyền, `/play` sẽ báo rõ tên quyền còn thiếu thay vì im lặng.

## 5. Chạy bot

```bash
# Môi trường dev (tự nạp TS)
npm run dev

# Build và chạy production
npm run build
npm start
```

## 6. Chạy unit test

```bash
npm test
```

## 7. Danh sách lệnh

Bot hỗ trợ cả **Slash Command** (`/`) và **Prefix Command** (mặc định là `!`, có thể đổi biến `PREFIX` trong `.env`):

| Chức năng | Slash Command | Prefix Command | Viết tắt (Alias) |
|---|---|---|---|
| Phát nhạc | `/play <query>` | `!play <query>` | `!p <query>` |
| Tạm dừng | `/pause` | `!pause` | - |
| Tiếp tục | `/resume` | `!resume` | - |
| Bỏ qua | `/skip` | `!skip` | `!s` |
| Xem hàng đợi | `/queue` | `!queue` | `!q` |
| Bài đang phát | `/nowplaying` | `!nowplaying` | `!np` |
| Tự động phát | `/autoplay <bat>` | `!autoplay on\|off` | `!ap` |
| Dừng & rời kênh | `/stop` | `!stop` | - |
| Kiểm tra ping | `/ping` | `!ping` | `!p` |

### Autoplay
Khi hàng đợi kết thúc, bot tự tìm bài liên quan (cùng ca sĩ/tên bài) trên YouTube Music và phát tiếp. **Mặc định BẬT**, tắt bằng `/autoplay bat:false` hoặc `!autoplay off`. Trạng thái lưu trong bộ nhớ — restart bot sẽ về mặc định BẬT.

## 8. Khắc phục sự cố

### Bot báo "Đang phát" nhưng không có tiếng
Bot sẽ tự báo lỗi trong kênh chat khi stream fail. Nếu vẫn cần xem chi tiết, log ở:

```powershell
Get-Content lavalink\logs\spring.log -Tail 60
```

#### Bước 0 — Xác định lỗi nằm ở hệ thống hay ở riêng video
Route `/youtube/stream/{videoId}` trả về audio stream thật, dùng để test nhanh **không cần kết nối voice**:

```powershell
$h=@{Authorization='youshallnotpass'}
Invoke-WebRequest "http://localhost:2333/youtube/stream/dQw4w9WgXcQ?withClient=ANDROID_VR" -Headers $h | Select-Object StatusCode,RawContentLength
```

- **200 + dung lượng vài MB** → hệ thống OK, lỗi là do riêng video đó bị YouTube giới hạn → thử video khác.
- **400/500** → lỗi hệ thống, làm tiếp các bước dưới.

> Lưu ý: test liên tục nhiều video sẽ bị YouTube rate-limit (mọi request đều trả 500 trong vài phút). Nghỉ 1-2 phút rồi test lại.

#### Bước 1 — Kiểm tra danh sách client
`MUSIC` **chỉ tìm kiếm, không phát được**. Chỉ client `TV` hỗ trợ OAuth. Danh sách đúng trong `application.yml`:
```yaml
clients:
  - TV
  - TVHTML5_SIMPLY
  - ANDROID_VR
  - WEBEMBEDDED
  - WEB
  - MUSIC
```

#### Bước 2 — Nâng cấp plugin
Lỗi `Something went wrong while looking up the track` thường do plugin cũ. Luôn dùng bản mới nhất:
`dev.lavalink.youtube:youtube-plugin:<version mới nhất>`.

#### Bước 3 — Bật OAuth (khi gặp lỗi bot-detection)
Nếu log có `Sign in to confirm you're not a bot` / `This video requires login` / `No supported audio streams available`, YouTube đang chặn IP/datacenter. OAuth là cách xử lý theo tài liệu chính thức:

```yaml
plugins:
  youtube:
    oauth:
      enabled: true

logging:
  level:
    dev.lavalink.youtube.http.YoutubeOauth2Handler: INFO
```

Sau đó:
1. Chạy `java -jar Lavalink.jar` trong terminal (phải thấy được log).
2. Terminal in ra `go to https://www.google.com/device and enter code XXXX-XXXX`.
3. Mở link đó, nhập code, đăng nhập bằng **tài khoản phụ (burner), KHÔNG dùng tài khoản chính**.
4. Sau khi xác thực, Lavalink in ra `refresh token` — dán vào `application.yml` để không phải xác thực lại:
   ```yaml
   oauth:
     enabled: true
     refreshToken: "token vua in ra"
     skipInitialization: true
   ```

### Nguồn backup khi YouTube chặn
Kiến trúc nguồn hiện tại:

| Nguồn | Prefix | Trạng thái |
|---|---|---|
| YouTube (qua **yt-dlp** của LavaSrc) | `ytsearch:` | ✅ engine chính, xử lý cả `ytsearch:` lẫn URL YouTube |
| SoundCloud | `scsearch` | ✅ backup đầu tiên |
| Spotify | `spsearch` | ⏸ cần `clientId`/`clientSecret` — xem bên dưới |
| Plugin YouTube (OAuth/TV client) | — | còn giữ làm lớp dự phòng khi lúc **load**, nhưng bị yt-dlp che khuất |

Khi YouTube từ chối stream, bot tự tìm bài tương tự trên SoundCloud và phát tiếp, đồng thời báo trong kênh:
`YouTube chan **<bài gốc>**. Da chuyen sang nguon khac: **<bài mới>**`

- Nguồn backup nằm trong `FALLBACK_SOURCES` (`src/music/fallback.ts`), thử lần lượt theo thứ tự, dừng ở nguồn đầu tiên có kết quả; nguồn lỗi hoặc rỗng thì bỏ qua.
- Mỗi bài chỉ thử backup **một lần** (chống lặp vô hạn).
- Tìm bằng tay: `!play scsearch:<tên bài>`.

#### Bật Spotify (khi có credential)
1. Tạo app miễn phí tại https://developer.spotify.com/dashboard, lấy `Client ID` + `Client Secret`.
2. Điền vào `lavalink/application.yml`, mục `plugins.lavasrc.spotify`, rồi đổi `plugins.lavasrc.sources.spotify` thành `true`.
3. Thêm `"spsearch"` vào đầu `FALLBACK_SOURCES` trong `src/music/fallback.ts`.

Lưu ý: Lavalink **không phát được audio gốc của Spotify** (DRM). Spotify chỉ dùng để tìm kiếm/metadata; audio thật vẫn lấy qua chuỗi `providers` (`ytsearch` → `scsearch`).

