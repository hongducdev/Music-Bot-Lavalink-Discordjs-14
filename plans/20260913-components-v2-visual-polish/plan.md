# Components V2 — Kế hoạch làm đẹp giao diện (Visual Polish)

**Nguồn tham khảo (source manifest):**
- Official docs: https://docs.discord.com/developers/components/reference.md
  (tải về `/tmp/discord-components-reference.md`, 147 129 bytes)
- Official guide: https://docs.discord.com/developers/components/using-message-components.md
- Cộng đồng: https://github.com/ZarScape/discord.js-v2-components + `discord.js-v14-v2-template`
- Local: [embed.ts](file:///D:/MyProjects/bot-discord/src/utils/embed.ts), [controller.ts](file:///D:/MyProjects/bot-discord/src/music/controller.ts), [player.ts](file:///D:/MyProjects/bot-discord/src/music/player.ts)

**Stack:** TypeScript, discord.js v14.27.0, Components V2 (`MessageFlags.IsComponentsV2` = `1 << 15` = 32768), Vitest.

**Trạng thái:** ✅ Task 1–5 đã implement + test xanh. ⏳ Task 6 (xác nhận bằng mắt trong Discord) chờ người dùng.

### Kết quả thực thi (2026-09-13)

- `npx tsc --noEmit` → sạch · `npm test` → **180/180 pass** (23 file) · `npm run build` → sạch.
- **Phát hiện 2 lỗi thật khi implement** (không có trong kế hoạch ban đầu):
  1. **Mất nội dung card bot-info** — [index.ts](file:///D:/MyProjects/bot-discord/src/index.ts) dùng `{ ...silentReply(card), components: [inviteButton] }`. Khoá `components` sau đè khoá trước ⇒ **Container bị vứt bỏ**, chỉ còn nút mời bot được gửi. Đã sửa thành `silentReply(card, [inviteButton])`.
  2. **Menu chọn đài nằm ngoài hộp** — [radio.ts](file:///D:/MyProjects/bot-discord/src/commands/music/radio.ts) đặt select menu song song với Container (đúng lỗi G1 ở 2 chỗ). Đã sửa thành `addActionRows(buildRadioSelectMenu())`.
- Ba nơi phát sinh Action Row đã được gom hết vào trong Container: `privateReply`, `silentReply`, `notify()` trong [player.ts](file:///D:/MyProjects/bot-discord/src/music/player.ts).
- `buildNowPlayingEmbed` và `notify()` trong `player.ts` nay dùng cùng một layout (section note + 2 separator lớn) để hai card "Now playing" không lệch nhau.

---

## 1. Ràng buộc API (trích nguyên văn từ docs — đây là hợp đồng cứng)

| Ràng buộc | Giá trị | Nguồn |
| --- | --- | --- |
| Tổng số component / message | **≤ 40** | reference.md L22 |
| Action Row | ≤ 5 button, **hoặc** 1 select | L111–115 |
| Section `components` | **1–3** Text Display | L1545 |
| Section `accessory` | Button **hoặc** Thumbnail | L1560 |
| Text Display `content` | tối đa **4000** ký tự | validator discord.js (đã kiểm chứng cục bộ) |
| Thumbnail | `description?` **alt text** ≤ 1024 ký tự | L1719 |
| Thumbnail | **chỉ ảnh** (kể cả GIF/WEBP), không video | L1707 |
| Media Gallery | 1–10 item, mỗi item `description?` ≤ 1024 | L1782 |
| Separator | `spacing`: **1** (nhỏ) \| **2** (lớn) | L1922 |
| Container con hợp lệ | Action Row, Text Display, Section, Media Gallery, Separator, File | L1993 |
| Button label | ≤ 34 ký tự (có icon) / ≤ 38 (không icon) | L265 |
| Button style | **chỉ 1 Primary mỗi nhóm** | L278 |
| Cờ V2 | **không thể gỡ** sau khi gửi | using-message-components.md |
| `content` + `embeds` | bị vô hiệu hoàn toàn khi bật V2 | L17 |

**Hệ quả:** mọi cải tiến "đẹp hơn" phải nằm trong 13 dòng trên. Không có ngoại lệ.

---

## 2. Khoảng trống giữa docs và code hiện tại

| # | Vấn đề | Hiện tại | Docs cho phép | Tác động thị giác |
| --- | --- | --- | --- | --- |
| G1 | **Nút điều khiển nằm NGOÀI hộp** | `privateReply(builder, rows)` đẩy Action Row thành **component cấp cao song song** với Container (`components: [container, ...rows]`) | Container **nhận Action Row làm con** (L1993, ví dụ coyote L2030) | Nút render rời rạc, mất dải accent color — lỗi thẩm mỹ rõ nhất |
| G2 | **Mọi separator đều `Small`** | `SeparatorSpacingSize.Small` hardcode 3 chỗ | `spacing: 2` = padding lớn | Card bí, thiếu nhịp thở giữa mô tả / fields / footer |
| G3 | **Thiếu alt text cho ảnh** | `new ThumbnailBuilder({ media: { url } })` — không `description` | `description?` ≤ 1024 | Lỗi accessibility; trình đọc màn hình không đọc được artwork |
| G4 | **Section chỉ dùng 2/3 slot** | Nhánh có thumbnail: `[author, description]` | **1–3** Text Display | Lãng phí 1 slot; thumbnail căn lệch với khối text ngắn |
| G5 | **Không có Media Gallery** | Không dùng type 12 | 1–10 item | Không có ảnh "hero" cỡ lớn — pattern đẹp nhất còn bỏ trống |
| G6 | **Không có test chặn vượt giới hạn** | Chỉ test nội dung | — | Beautify dễ vô tình vượt 40 component / 3 section child |

---

## 3. Challenge (bắt buộc trước khi lên kế hoạch)

**C1 — G1 có thật sự đẹp hơn không, hay chỉ là giả định?**
Trả lời nguồn: docs xếp Container là "visually encapsulate a collection of components" và liệt kê Action Row là con hợp lệ; ví dụ chính thức (coyote) đặt Action Row **trong** container.
Trả lời local: chúng ta đặt nút ngoài container.
Rủi ro nếu sai: nút bị nhốt trong hộp, muốn tách ra phải sửa lại lần nữa. **Giảm thiểu:** verify bằng mắt trong Discord sau khi implement (xem C6).
→ **Kết luận: làm.**

**C2 — Có nên thêm Media Gallery (ảnh lớn) cho card now-playing?**
Trả lời nguồn: gallery là content component cấp cao, đẹp và nổi bật.
Trả lời local: card now-playing đã có thumbnail 64px + 5 nút; ảnh lớn sẽ đẩy nút xuống dưới màn hình điện thoại.
Rủi ro nếu làm: card cao gấp đôi, mất tính "bảng điều khiển gọn".
→ **Kết luận: KHÔNG làm bây giờ (YAGNI).** Ghi nhận là tuỳ chọn tương lai; chỉ thêm `setImage()` khi có card thật sự cần ảnh lớn.

**C3 — 1 Primary button mỗi nhóm: hiện trạng có vi phạm?**
Trả lời nguồn: "Use only one Primary button per group" + "If multiple buttons of equal significance, use Secondary for all".
Trả lời local: controller = 4× Secondary + 1× Danger. Ôn tập đúng chuẩn.
→ **Kết luận: không cần sửa.** (Play/Pause đồng hạng với Skip/Shuffle/Loop nên Secondary là đúng; Stop là hành vi phá huỷ nên Danger hợp lý.)

**C4 — Nhồi thêm slot thứ 3 vào Section có phải trang trí thừa?**
Trả lời nguồn: 1–3 child, không bắt buộc dùng hết.
Trả lời local: có dữ liệu thật để đưa vào (dòng trạng thái/duration đang nằm rời trong fields).
Rủi ro: gộp nhiều text vào section làm section phình, khó đọc.
→ **Kết luận: chỉ gộp khi thông tin liên quan trực tiếp tới tiêu đề.** Cụ thể: now-playing gộp `track title` + `artist · duration` vào section; các chỉ số khác giữ ở fields. Không gộp tràn lan.

**C5 — `spacing: 2` có gây card quá dài không?**
Trả lời nguồn: `2` là large padding, hợp lệ.
Trả lời local: card hiện có 2 separator → tăng lên large thêm ~16px chiều cao.
→ **Kết luận: dùng large CHỈ ở ranh giới khối chính (mô tả → fields, fields → footer); giữ small cho phân cách phụ.** Không đổi hết thành large.

**C6 — Làm sao chứng minh "đẹp hơn" nếu không đo được?**
Trả lời nguồn: không có metric thẩm mỹ.
Trả lời local: chúng ta có test tự động nhưng chỉ đo được tính hợp lệ API.
→ **Kết luận: đẹp phải do con người xác nhận bằng mắt trong Discord. Kèm theo đó là guard tự động cho phần ĐO ĐƯỢC (G6).** Hai thứ khác nhau, không thay thế nhau.

**C7 — Cờ V2 không gỡ được — có rủi ro rollback?**
Trả lời nguồn: "once the message has been sent, the flag cannot be removed".
Trả lời local: mọi tin nhắn bot đã gửi đều V2; rollback code không làm tin cũ hiển thị lại dạng embed.
→ **Kết luận: chấp nhận.** Không có đường lùi cho tin đã gửi, nhưng code cũ vẫn build lại được cho tin mới.

---

## 4. Dependency Matrix

| Thành phần nguồn (docs) | Local tương ứng | Trạng thái |
| --- | --- | --- |
| Container.con Components nhận Action Row | `MessageContainerBuilder.addActionRows()` | `EXISTS` (đã có, chưa nối vào luồng reply) |
| Separator `spacing: 2` | `SeparatorSpacingSize.Large` | `EXISTS` (chưa dùng) |
| Thumbnail `description` | `ThumbnailBuilder.setDescription()` | `EXISTS` (chưa dùng) |
| Section 3 children | `SectionBuilder.addTextDisplayComponents()` | `EXISTS` (đang dùng 2) |
| Media Gallery | `MediaGalleryBuilder` | `EXISTS` (chưa dùng — hoãn) |
| Guard đếm component | — | **`NEW`** |

Không cần thư viện mới. Không cần migration. Không đổi schema.

---

## 5. Kế hoạch triển khai

**Ước lượng:** 3 file sửa (`src/utils/embed.ts`, `src/commands/music/now-playing.ts`, `src/music/player.ts`), 1 file test sửa/thêm. Không tạo file nguồn mới.
**Rủi ro:** thấp. Không đổi API công khai của `embed()`; chỉ đổi cách lắp ráp component.
**Rollback:** `git revert` commit tương ứng; tin nhắn đã gửi giữ nguyên dạng V2 (xem C7).

### Task 1: Đưa Action Row vào trong Container (G1)

**Files:** `src/utils/embed.ts` · **Test:** `tests/embed.test.ts`

- [x] **Step 1:** Viết test khẳng định action row nằm **trong** `container.components`, không phải sibling cấp cao.
  ```ts
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("x").setLabel("X").setStyle(ButtonStyle.Secondary)
  );
  const payload = privateReply(embed("hi"), [row]);
  expect(payload.components.length).toBe(1);            // chỉ Container
  const json = (payload.components[0] as any).toJSON();
  expect(json.components.some((c: any) => c.type === 1)).toBe(true);
  ```
- [x] **Step 2:** Trong `privateReply`/`silentReply`, thay `components: [builder, ...rows]` bằng `builder.addActionRows(...rows)` rồi trả `components: [builder]`.
- [x] **Step 3:** `npx vitest run tests/embed.test.ts` → xanh.

### Task 2: Nhịp thở bằng Separator `spacing: 2` (G2)

**Files:** `src/utils/embed.ts` · **Test:** `tests/embed.test.ts`

- [x] **Step 1:** Test: separator trước khối fields và trước footer có `spacing === 2`; separator phụ giữ `1`.
- [x] **Step 2:** Dùng `SeparatorSpacingSize.Large` cho 2 ranh giới khối chính; giữ `Small` cho phân cách phụ trong `formatFields`.
- [x] **Step 3:** `npx vitest run tests/embed.test.ts` → xanh.

### Task 3: Alt text cho Thumbnail (G3)

**Files:** `src/utils/embed.ts`, `src/commands/music/now-playing.ts`, `src/music/player.ts` · **Test:** `tests/embed.test.ts`

- [x] **Step 1:** Test: `setThumbnail(url, alt)` → `accessory.description === alt`, và `alt.length <= 1024`.
- [x] **Step 2:** Mở rộng `setThumbnail(url: string | null, description?: string)`; truyền `description` vào `new ThumbnailBuilder({ media: { url } }).setDescription(clip(alt, 1024))`.
- [x] **Step 3:** Cập nhật nơi gọi: truyền `"Ảnh bìa bài hát"` cho now-playing, `"Ảnh bìa bài hát"` cho `notify()` trong `player.ts`.
- [x] **Step 4:** `npm test` → xanh.

### Task 4: Dùng slot thứ 3 của Section cho now-playing (G4)

**Files:** `src/commands/music/now-playing.ts`, `src/utils/embed.ts` · **Test:** `tests/embed.test.ts`

- [x] **Step 1:** Test: card now-playing có Section với **3** Text Display; text chứa cả tiêu đề, kênh và thời lượng.
- [x] **Step 2:** Cho `MessageContainerBuilder` nhận `sectionExtras?: string[]` (tối đa 3 child, tự `clip`) HOẶC dựng section trực tiếp trong `buildNowPlayingEmbed`.
  → **Chọn cách 2** (dựng trực tiếp trong `now-playing.ts`) để không phình API dùng chung. Giữ `embed()` nguyên trạng.
- [x] **Step 3:** `npm test` → xanh.

### Task 5: Guard chống vượt giới hạn API (G6) — phần ĐO ĐƯỢC

**Files:** `tests/components-v2-limits.test.ts` (mới) · **Test:** chính nó

- [x] **Step 1:** Viết helper đếm component đệ quy (Container/Section/ActionRow là node cha).
- [x] **Step 2:** Assert cho **mọi** card thật (`embed(...)` với thumbnail/fields/footer, `buildBotInfoEmbed`, `buildQueueEmbed`, `buildNowPlayingEmbed`, `buildRadioEmbed`):
  - tổng component ≤ **40**
  - mỗi Section có **1–3** child
  - `spacing` ∈ {1, 2}
  - Thumbnail `description` ≤ 1024 (nếu có)
  - mỗi Text Display `content` ≤ 4000
  - mỗi Action Row ≤ 5 button **hoặc** đúng 1 select
  - **≤ 1 button style Primary** mỗi Action Row
  - button label ≤ 38 ký tự
- [x] **Step 3:** `npm test` → xanh.

### Task 6: Xác nhận bằng mắt (C6) — không tự động hoá được

- [ ] **Step 1:** Chạy `npm run dev`, gửi `/nowplaying`, `/queue`, `/help`, `/radio`, `/ping`, và ping bot để xem card bot-info.
- [ ] **Step 2:** Kiểm tra trên **cả desktop và mobile**: nút đã nằm trong dải accent chưa; khoảng cách có dễ đọc không; section có bị lệch không.
- [ ] **Step 3:** Nếu nút-in-container trông xấu hơn → revert riêng Task 1 (`git revert`), giữ Task 2–5.

---

## 6. Verification

```bash
npx tsc --noEmit      # 0 lỗi type
npm test              # toàn bộ suite + guard mới
npm run build         # build sạch
```

---

## 7. Handoff

Đây là output phân tích của `/ck:xia` — **chưa viết code**. Để triển khai:

```text
/ck:cook plans/20260913-components-v2-visual-polish/plan.md
```
