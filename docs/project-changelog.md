# Project Changelog

## Unreleased — 2026-09-16

### Changed

- **Lavalink tách khỏi repo bot.** `lavalink/` (jar, `application.yml`, launcher) chuyển sang runtime riêng ở `../lavalink-runtime`, có `.env` riêng, `README.md` và `.gitignore` riêng. Repo bot chỉ còn `LAVALINK_HOST`, `LAVALINK_PORT`, `LAVALINK_SECURE`, `LAVALINK_PASSWORD` trong `.env`; `.gitignore`, `.env.example`, `README.md` và `docs/troubleshooting.md` cập nhật theo. `LAVALINK_PASSWORD` phải trùng ở hai `.env`.
- JVM của Lavalink được giới hạn trong launcher của runtime (`-Xms64m -Xmx768m -XX:+UseSerialGC -XX:MaxMetaspaceSize=256m -XX:ReservedCodeCacheSize=128m -XX:MaxDirectMemorySize=256m`, đổi được bằng `JAVA_OPTS`). Trước đây `java -jar Lavalink.jar` để JVM tự lấy heap tối đa 25% RAM máy (máy 16GB → **4GB**), kèm Metaspace reserve 1GB và code cache 240MB.
- `plugins.lavasrc.ytdlp.path` đọc `${YTDLP_PATH:./yt-dlp.exe}` để host Linux trỏ vào `yt-dlp` của hệ thống mà không phải sửa file được commit.
- Cache discord.js được giới hạn trong `src/index.ts`: 50 tin nhắn mỗi kênh (mặc định 200) và sweep tin cũ hơn 10 phút (mặc định chỉ sweep thread), nên `client.users` không tích lại theo thời gian chạy; `npm start` thêm `--max-old-space-size=384`.
- `playerUpdateInterval` giữ nguyên 5 giây kèm comment giải thích lý do (xem Verification).

### Verification

- Đo trên máy dev (Lavalink 4.2.2, một player radio HLS), cùng máy cùng tải: không flag → **RSS 294 MB / 60 thread / CPU 0.13 %**; bộ flag trong launcher → **200 MB / 46 thread / 0.01 %** (rảnh) và 224 MB khi đã tạo player. Các biến thể khác cùng mức heap: G1 `-Xms64m` 244 MB, SerialGC `-Xms256m` 254 MB, ParallelGC 429 MB (loại). Số đo và cách đo lại nằm ở `../lavalink-runtime/README.md`.
- `jcmd VM.flags` xác nhận JVM chạy `MaxHeapSize=768MB`, `+UseSerialGC`, metaspace 256MB, code cache 128MB, direct 256MB. Tạo player thật qua REST (`PATCH /v4/sessions/{id}/players/{guild}` → 200) và `npm run verify:radio` load đủ **11/11 đài** — chạy lại sau khi tách runtime, nên cũng chứng minh bot chỉ cần bốn biến `LAVALINK_*`.
- Node: `npm run build` + **210 test / 28 file pass**; bot chạy tới bước đăng nhập với Client options mới (dừng ở token giả, không lỗi khởi tạo — assertion libuv khi thoát đã có từ trước, kiểm chứng bằng cách stash `src/index.ts`). Footprint lúc khởi động: `dist` 86 MB, `tsx` 128 MB.
- **Chưa đo được CPU lúc phát nhạc thật**: Lavalink chỉ chạy pipeline decode/encode sau khi kết nối voice, việc đó cần bot đăng nhập và vào kênh thoại. Cần đo lại trên VPS đang chạy thật.
- Review đối kháng trên diff bắt được một lỗi thứ tự trong `start.sh` của runtime (đọc `LAVALINK_PORT` trước khi nạp `.env` nên guard kiểm tra sai port) — đã sửa và kiểm chứng lại cả hai nhánh. Cùng review đó đề xuất `playerUpdateInterval` 5 → 30; đã **loại bỏ** vì `player.connected` chỉ cập nhật theo frame đó, mà `play`/`radio` dùng nó làm guard trước khi gửi op 4 — lợi ích không đo được, đổi lại là join voice thừa.
- Hệ quả cần làm tay: `YT_OAUTH_REFRESH_TOKEN` và `SPOTIFY_*` giờ nằm trong `.env` của runtime và đang để trống sau khi tách (xem `.env.example` của runtime để lấy lại; YouTube chạy được không cần OAuth, chỉ bật khi bị bot-detection).

## Unreleased — 2026-09-13

### Added

- `/weather <diadiem>`, prefix/mention equivalents and `thoitiet` alias: Vietnamese Components V2 current conditions, apparent temperature, humidity, wind, today's range/UV/rain probability, six future forecast hours and seven days. Open-Meteo + GeoNames, inspired by Overmorrow's provider choice; no copied code/assets or dependencies.
- Owner-bound location selection for ambiguous names, destination-local times, missing-data placeholders and bounded requests with safe provider errors. Slash replies ephemeral; prefix replies silent/public. Requires command registration and bot restart.

### Changed

- Restored original pastel pink #ECC5C0 across music, utility and weather containers, with original error red #FF4949. Playback progress now uses a separate 48-segment code block and puts elapsed/total time on the following line; native Discord controls final sizing.

- YouTube-inspired music layout: artwork first, linked title/artist, bounded timeline and labelled controls before next-track details. Red music accent on nowplaying, queue and added-track cards; live streams omit progress. Centralized heading/controller icon vocabulary, plain metadata labels, repeat-mode labels and invite-button icon across V2 cards. Refreshed nine-state local preview.

- Rebuilt shared Components V2 layout: native JSON only, blurple/red accents, separate content groups, compact separators, controls before muted footer. Removed synthetic embed metadata and unused bot-author icon state.
- Unified track-start and nowplaying cards with Media Gallery artwork, listening details, next-track preview and one primary playback button.
- Queue now presents the current track first, followed by ten bounded titles. Redesigned help categories, radio groups, bot introduction and Vietnamese command feedback.

### Fixed

- Phản hồi radio/`/play` sau khi defer: gửi kèm `MessageFlags.IsComponentsV2` ở chính lần tạo card. Discord không gán flag V2 cho message defer, nên `editReply` thiếu flag bị từ chối (`Invalid Form Body … type must be one of (1,)`) — đài đổi xong nhưng người dùng vẫn thấy báo lỗi. Lỗi gửi card cũng không còn bị báo thành "đổi đài lỗi" (chỉ ghi log), và `client.on("error")` giữ bot sống khi Discord trả event `error`.

- Radio giu quyen phat khi dang phat dai: autoplay khong con thay dai bang bai lien quan, moi track dai (ke ca livestream YouTube, khong chi HLS `http`) duoc tinh la "dang phat dai" nen bo dem loi hoat dong dung, va loi luong dai bao dung la loi dai thay vi "YouTube chan stream nguon nay".

- Radio transition: replace the current track explicitly with `clientTrack`, `paused: false`, and position zero instead of stop/skip plus asynchronous track-end advancement. Clear queued songs through the queue API and disable inherited repeat mode; restore local queue/current/repeat and station selection if replacement fails. Shared by slash, prefix and station menu. Regression checks exercise the installed Lavalink Player/Queue with only network transport stubbed.

- Low-impact ping display: `/ping` and prefix ping now measure the awaited HTTP reply with a monotonic clock, replacing local-time minus Discord-time subtraction that could report negative latency. Rename WebSocket metric to Gateway heartbeat; unavailable samples display no fabricated value. Keep uptime and response visibility; edit the original reply instead of posting another message.
- Medium-impact payload rejection risk: bound combined card text and recursive component count; cap media alt text and ignore malformed/non-web media URLs.
- Escape track-title brackets and Markdown; validate link schemes before rendering provider metadata.
- Low-impact queue display: live-stream durations no longer inflate total time with Java's unlimited-duration sentinel.

### Verification

- Radio keepalive + V2 reply: build passes, 210 tests / 28 files pass. Hai test trong `tests/radio-command.test.ts` fail nếu bỏ `flags: RADIO_REPLY_FLAGS`; ba test trong `tests/radio-keepalive.test.ts` fail nếu bỏ guard autoplay/đếm lỗi đài. Live: nhạc đang phát → VOV3 → `playing=true` 60s, không `trackError`, không `WARN/ERROR` phía Lavalink; REST kiểm chứng `PATCH` message V2 thiếu flag = 200 còn gửi type 17 vào message không flag = 400. Chưa tự bấm được interaction thật (cần người dùng restart và chọn đài).

- Music UI refresh: build passes, 200 tests / 26 files pass. Checks include media/control order, repeat-mode labels, shared heading icons and progress bounds. Nine illustrative previews generated from production builders; live Discord visual acceptance not performed.

- Weather: build and 197 tests / 25 files pass, including six weather regression checks. Live search → location lookup → forecast → V2 serialization succeeded for Hanoi (168 hourly rows, seven daily rows). Live Discord acceptance and deployment not performed.

- Ping regression: 6 dedicated tests cover both handlers, clock skew/rollback, unavailable heartbeat and failed sends. Full suite: 191 tests / 24 files; build passes.
- Build passes; 185 tests pass across 23 files. Tests inspect actual V2 JSON, all loaded help commands, long metadata, artwork fallback, live queues and existing command behavior.
- Local preview includes seven card types. Browser policy blocked opening local files; no live Discord visual/API acceptance or restart performed.
- Cards remain snapshots at send time; use `/nowplaying` to refresh state. No new dependencies.

## Unreleased — 2026-09-12

### Added

- Optional requester RPC: `/rpc connect`, `/rpc status`, `/rpc disconnect`, plus prefix equivalents.
- Requester-bound OAuth PKCE with expiring single-use state and in-memory Gaming SDK connections.
- Song title, artist, timing and song link; pause/resume and stop/queue lifecycle synchronization.
- Local security/state tests and real loopback WebSocket protocol checks.
- Bot info embed (on a direct ping) adds a "Mời bot" link button carrying exactly the permissions the bot needs.

### Fixed

- Autoplay/fallback now pass the track requester to Lavalink search, preserving attribution for RPC.
- Bot info now appears **only on a real ping**. Replying to a bot message no longer triggers it: Discord puts the author of the message being replied to into `message.mentions.users` even when the message text contains no ping, so the gate now also requires `message.mentions.parsedUsers` (ping tokens actually present in the content). See `shouldShowBotInfo` in `src/bot-info.ts`.
- Bot info card was being sent without its content: the reply payload spread `silentReply(card)` and then overwrote the `components` key with the invite button, dropping the whole container. Now passes the button through `silentReply(card, [button])`.

### Changed

- README condensed to setup, commands and features; deep playback troubleshooting moved to `docs/troubleshooting.md`, and the stale `application.example.yml` copy step is gone.

### Limitations

- Needs application Social SDK/Public Client and a registered callback. Live Discord acceptance not yet performed.
- Restart, access-token expiry or lost Gateway requires relinking; no persistent tokens or automatic refresh.
