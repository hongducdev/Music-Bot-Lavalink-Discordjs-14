# Radio đổi đài xong nhưng báo lỗi

Bối cảnh: báo lỗi "đang phát nhạc mà dùng radio thì không phát được", sau đó là "đổi đài thành công nhưng lại báo lỗi". Log Lavalink + lịch sử kênh Discord cho thấy bot **đã** đổi track và **đã** đăng card "Đang phát VOV3"; không có `WARN`/`ERROR` nào ở phía Lavalink trong lúc test (16:27–16:32) nên luồng đài không hỏng.

**Nguyên nhân gốc:** `deferReply({ flags: Ephemeral | IsComponentsV2 })` — Discord **không** gán `IS_COMPONENTS_V2` cho message defer, nên `editReply({ components: [container] })` (không kèm flag) bị từ chối `Invalid Form Body … Value of field type must be one of (1,)`. Đài đã đổi và đang phát, nhưng phản hồi lỗi nên người dùng thấy báo lỗi. Đối chiếu: sửa một message **đã** có flag V2 thì không cần gửi lại flag (card ping của prefix vẫn edit được), còn gửi type 17 vào message không có flag thì Discord từ chối — đúng như REST test với bot token (`PATCH` message V2 thiếu flag = 200; `PATCH` message thường thành V2 thiếu flag = 400).

**Sửa:** gửi kèm `MessageFlags.Ephemeral | MessageFlags.IsComponentsV2` ở chính lần tạo components — `replyRadioResult` dùng chung cho menu + slash (`RADIO_REPLY_FLAGS`), và `/play` (3 nhánh trả lời). Lỗi gửi card **không** còn bị báo thành "đổi đài lỗi": `handleRadioSelection` chỉ ghi log, vì đài đã phát thật.

Sửa kèm trong lúc kiểm tra — luật "đang phát đài thì autoplay/fallback phải nhường":

- `queueRelatedTrack` trả về sớm khi có đài đang phát (trước chỉ chặn HLS `http`), nên livestream YouTube không bị thay bằng bài liên quan.
- `trackStart` coi mọi track đài là "đang phát đài" (`markRadioStarted`), không chỉ HLS; trước đây đài YouTube luôn bị tính là đứt sớm và bỏ đài sau 3 lần.
- `trackError` khi có đài: báo đúng lỗi đài và để `handleQueueEnd` phát lại, không thử "nguồn YouTube khác".
- `index.ts`: thêm `client.on("error")` (Node tắt tiến trình nếu event `error` không có listener).

Kiểm chứng: 5 test trong `tests/radio-command.test.ts` (2 test flag fail nếu bỏ `flags: RADIO_REPLY_FLAGS`) + 3 test trong `tests/radio-keepalive.test.ts`; toàn bộ 210 test / 28 file pass, `tsc` pass, chạy thật nhạc → VOV3 sống qua 60s không `trackError`. Chưa tự bấm được interaction thật (chỉ người dùng làm được) nên bước xác nhận cuối là người dùng restart bot và chọn đài lại.
