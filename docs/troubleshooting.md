# Khắc phục sự cố phát nhạc

Nội dung chi tiết cho mục "Khắc phục sự cố" trong [README](../README.md): lỗi bot báo "Đang phát" mà không có tiếng, YouTube chặn, và các nguồn phát dự phòng.

## Bot báo "Đang phát" nhưng không có tiếng

Bot tự báo lỗi trong kênh chat khi stream fail. Cần chi tiết thì xem log:

```powershell
Get-Content lavalink\logs\spring.log -Tail 60
```

### Bước 0 — Xác định lỗi nằm ở hệ thống hay ở riêng video
Route `/youtube/stream/{videoId}` trả về audio stream thật, dùng để test nhanh **không cần kết nối voice**:

```powershell
$h=@{Authorization='youshallnotpass'}
Invoke-WebRequest "http://localhost:2333/youtube/stream/dQw4w9WgXcQ?withClient=ANDROID_VR" -Headers $h | Select-Object StatusCode,RawContentLength
```

- **200 + dung lượng vài MB** → hệ thống OK, lỗi là do riêng video đó bị YouTube giới hạn → thử video khác.
- **400/500** → lỗi hệ thống, làm tiếp các bước dưới.

> Test liên tục nhiều video sẽ bị YouTube rate-limit (mọi request đều trả 500 trong vài phút). Nghỉ 1-2 phút rồi test lại.

### Bước 1 — Kiểm tra danh sách client
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

### Bước 2 — Nâng cấp plugin
Lỗi `Something went wrong while looking up the track` thường do plugin cũ. Luôn dùng bản mới nhất:
`dev.lavalink.youtube:youtube-plugin:<version mới nhất>`.

### Bước 3 — Bật OAuth (khi gặp lỗi bot-detection)
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

## Nguồn backup khi YouTube chặn

| Nguồn | Prefix | Trạng thái |
|---|---|---|
| YouTube (qua **yt-dlp** của LavaSrc) | `ytsearch:` | ✅ engine chính, xử lý cả `ytsearch:` lẫn URL YouTube |
| SoundCloud | `scsearch` | ✅ backup đầu tiên |
| Spotify | `spsearch` | ⏸ cần `clientId`/`clientSecret` — xem bên dưới |
| Plugin YouTube (OAuth/TV client) | — | còn giữ làm lớp dự phòng khi **load**, nhưng bị yt-dlp che khuất |

Khi YouTube từ chối stream, bot tự tìm bài tương tự trên SoundCloud và phát tiếp, đồng thời báo trong kênh:
`YouTube chan **<bài gốc>**. Da chuyen sang nguon khac: **<bài mới>**`

- Nguồn backup nằm trong `FALLBACK_SOURCES` (`src/music/fallback.ts`), thử lần lượt theo thứ tự, dừng ở nguồn đầu tiên có kết quả; nguồn lỗi hoặc rỗng thì bỏ qua.
- Mỗi bài chỉ thử backup **một lần** (chống lặp vô hạn).
- Tìm bằng tay: `!play scsearch:<tên bài>`.

### Bật Spotify (khi có credential)

1. Tạo app miễn phí tại https://developer.spotify.com/dashboard, lấy `Client ID` + `Client Secret`.
2. Điền `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET` vào `.env` (**không** điền vào `lavalink/application.yml` vì file đó được commit — `application.yml` đọc sẵn hai biến này), rồi đổi `plugins.lavasrc.sources.spotify` thành `true`.
3. Thêm `"spsearch"` vào đầu `FALLBACK_SOURCES` trong `src/music/fallback.ts`.

Lưu ý: Lavalink **không phát được audio gốc của Spotify** (DRM). Spotify chỉ dùng để tìm kiếm/metadata; audio thật vẫn lấy qua chuỗi `providers` (`ytsearch` → `scsearch`).
