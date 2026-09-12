# 🎵 Discord Music Bot (Lavalink + discord.js v14)

![Node.js 22+](https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white)
![TypeScript 7](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)
![discord.js v14](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)
![Lavalink v4](https://img.shields.io/badge/Lavalink-v4-9333EA)
![Java 17+](https://img.shields.io/badge/Java-17%2B-ED8B00?logo=openjdk&logoColor=white)
![tests: vitest](https://img.shields.io/badge/tests-vitest-6E9F18?logo=vitest&logoColor=white)

Bot Discord nghe nhạc bằng TypeScript, dùng **discord.js v14** và **Lavalink v4** (hỗ trợ phát nhạc từ YouTube qua Lavalink source).

## 1. 📦 Yêu cầu hệ thống

- Node.js 22+
- Java 17+ (để chạy Lavalink v4 độc lập)
- Token bot Discord và Application ID từ Discord Developer Portal

## 2. 🚀 Cài đặt

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

## 3. 🎧 Chạy Lavalink độc lập (không Docker)

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

## 4. ⚙️ Deploy slash command

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

## 5. ▶️ Chạy bot

```bash
# Môi trường dev (tự nạp TS)
npm run dev

# Build và chạy production
npm run build
npm start
```

## 6. 🧪 Chạy unit test

```bash
npm test
```

## 7. 🎮 Danh sách lệnh

Bot hỗ trợ cả **Slash Command** (`/`), **Prefix Command** (`!`, đổi bằng biến `PREFIX` trong `.env`) và **ping thẳng bot** (`@TênBot <lệnh>`):

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
| Kiểm tra ping | `/ping` | `!ping` | - |
| Trợ giúp | `/help [lenh]` | `!help [lenh]` | `!h` |
| RPC trên profile | `/rpc connect\|status\|disconnect` | `!rpc connect\|status\|disconnect` | - |

> `/help` đọc thẳng danh sách lệnh đang nạp trong bot, nên **lệnh mới tự xuất hiện**, không cần sửa bảng này.
> Mỗi lệnh đều có cả bản slash và prefix — prefix `!p` là của `play` (không còn trùng với `ping`).

### Ping bot
Gõ `@TênBot` (ping trực tiếp, không kèm gì) để bot trả lời thẻ thông tin: ping, thời gian hoạt động, số server/thành viên, prefix, tác giả.

Ping bot cũng thay được cho prefix: `@TênBot play con cá con chim` tương đương `!play con cá con chim`. Ping kèm tên lệnh sai cũng trả về thẻ thông tin để người dùng biết đường.

Bot **bỏ qua** `@everyone`, `@here` và ping role — nên không bắn thẻ này vào mọi tin nhắn. Tin nhắn có prefix (`!play …`) luôn được xử lý như lệnh trước, không bị thẻ thông tin “cướp”.

### Autoplay
Khi hàng đợi kết thúc, bot tự lấy danh sách **mix (RD)** của bài vừa phát trên YouTube — đây là danh sách bài liên quan thật sự, đa dạng — rồi chọn ngẫu nhiên một bài **chưa phát gần đây**. Nếu mix lỗi hoặc rỗng, bot lùi về tìm theo tên kênh (nghệ sĩ) trên YouTube Music. Bot nhớ 30 bài gần nhất mỗi server nên autoplay không lặp lại bài cũ. **Mặc định BẬT**, tắt bằng `/autoplay bat:false` hoặc `!autoplay off`. Trạng thái lưu trong bộ nhớ — restart bot sẽ về mặc định BẬT.

### RPC trên profile người nghe

Người dùng chạy `/rpc connect`, mở link riêng tư và cấp quyền bằng **đúng tài khoản gọi lệnh**.
Ai đã liên kết mà đang ngồi cùng kênh voice với bot sẽ thấy Rich Presence của bài đang phát; người yêu cầu bài cũng thấy dù không ở trong voice.
Rich Presence gồm tên bot hiện tại, tên bài, nghệ sĩ, thời gian và nút mở bài hát.
`!rpc connect` gửi link qua DM; nếu chặn DM, dùng slash command. Link hết hạn sau 5 phút.

Thiết lập một lần cho chủ bot:

1. Mở application có ID bằng `CLIENT_ID` trong Discord Developer Portal, bật Social SDK và OAuth2 **Public Client**.
2. Đăng ký Redirect URL và đặt cùng giá trị vào `.env`:

   ```env
   RPC_REDIRECT_URI=https://your-domain.example/callback
   RPC_HOST=127.0.0.1
   RPC_PORT=8787
   ```

3. Reverse proxy HTTPS của domain đó tới `http://127.0.0.1:8787`. Callback phải truy cập được từ trình duyệt của người cấp quyền. Không ghi query string callback vào access log vì chứa authorization code.
   Tự thử trên máy chạy bot có thể dùng `http://127.0.0.1:8787/callback` và đăng ký Redirect tương ứng; **localhost của người khác không trỏ tới máy bot**.
4. Chạy `npm run deploy` để đăng ký `/rpc`, rồi khởi động lại bot. Không cần client secret hay token tài khoản Discord cá nhân.

Scope dùng là `openid sdk.social_layer_presence`, theo [tài liệu Social SDK](https://docs.discord.com/developers/discord-social-sdk/core-concepts/oauth2-scopes).
Mã giao tiếp Gateway tham khảo [Discord-OAuth2-RPC](https://github.com/aiko-chan-ai/Discord-OAuth2-RPC/tree/07ea5a6dc707b529a1eef5f3343224a40d1bcb42); đây là tích hợp PoC với Gateway Gaming SDK, chưa phải bảo đảm hỗ trợ lâu dài của Discord.

- `/rpc status` kiểm tra kết nối; `/rpc disconnect` đóng phiên và xóa dữ liệu liên kết trong bot. Thu hồi quyền ứng dụng hoàn toàn tại Discord → Authorized Apps.
- Pause bỏ timer đang chạy; resume cập nhật lại. Hết bài, stop, bot rời voice hoặc người nghe rời kênh voice sẽ xóa RPC cũ. Các cập nhật được gộp, có thể trễ khoảng 4 giây.
- Autoplay và nguồn fallback giữ requester của bài trước. Nếu cùng một người phát ở nhiều server, bài bắt đầu gần nhất được ưu tiên.
- Token chỉ giữ trong RAM, không ghi file/database; không refresh hoặc tự reconnect. Restart bot, token hết hạn hay Gateway ngắt kết nối thì chạy `/rpc connect` lại.
- Nếu chưa cấp quyền, nhạc vẫn phát bình thường. Bỏ trống `RPC_REDIRECT_URI` để tắt tính năng.
- Kiểm thử tự động xác nhận logic và kết nối WebSocket cục bộ; cần thử OAuth và profile thực tế bằng application đã bật Social SDK. Nếu không thấy activity, kiểm tra quyền ứng dụng và cài đặt chia sẻ hoạt động của người dùng.

### Tin nhắn tự xoá
Kênh chat không bị spam: bot tự xoá tin nhắn của chính nó sau một thời gian (khai báo ở `DELETE_AFTER` trong `src/utils/embed.ts`).

| Loại tin nhắn | Tự xoá sau |
|---|---|
| Embed lỗi / cảnh báo (chưa vào voice, thiếu quyền, không có bài đang phát, không tìm thấy bài…) | 20 giây |
| Thông báo hết nhạc, bài bị kẹt, phải đổi nguồn phát | 20 giây |
| Card **Now playing** (bắn ra mỗi lần chuyển bài) | 2 phút |
| `/nowplaying` và `!nowplaying` | 2 phút |
| Xác nhận pause/resume/skip/stop/autoplay, `/queue`, `/help`, thẻ thông tin khi ping bot | giữ lại |

Bot chỉ xoá tin nhắn của chính nó, và lỗi khi xoá (bị xoá tay trước đó, mất quyền) được bỏ qua nên không làm sập bot.

## 8. 🔧 Khắc phục sự cố

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
1. Chạy Lavalink qua script để `.env` được nạp và log hiện ngay trên terminal:
   ```powershell
   .\lavalink\start.ps1
   ```
   > Đừng chạy `java -jar Lavalink.jar` trực tiếp ở bước này — sẽ mất `LAVALINK_PASSWORD` và bot báo lỗi 401.
2. Terminal in ra `go to https://www.google.com/device and enter code XXXX-XXXX`.
3. Mở link đó, nhập code, đăng nhập bằng **tài khoản phụ (burner), KHÔNG dùng tài khoản chính**.
4. Sau khi xác thực, Lavalink in ra `refresh token` — dán vào `.env` để không phải xác thực lại (**không** dán vào `application.yml` vì file đó được commit):
   ```
   YT_OAUTH_REFRESH_TOKEN=token vua in ra
   ```
   `application.yml` đã đọc sẵn biến này qua `${YT_OAUTH_REFRESH_TOKEN:}`.

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
2. Điền `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET` vào `.env` (**không** điền vào `lavalink/application.yml` vì file đó được commit — `application.yml` đọc sẵn hai biến này), rồi đổi `plugins.lavasrc.sources.spotify` thành `true`.
3. Thêm `"spsearch"` vào đầu `FALLBACK_SOURCES` trong `src/music/fallback.ts`.

Lưu ý: Lavalink **không phát được audio gốc của Spotify** (DRM). Spotify chỉ dùng để tìm kiếm/metadata; audio thật vẫn lấy qua chuỗi `providers` (`ytsearch` → `scsearch`).

---

Quy ước commit message và checklist trước khi commit: xem [CONTRIBUTING.md](CONTRIBUTING.md).
