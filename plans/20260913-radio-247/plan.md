# 24/7 Radio Station Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai tính năng Đài phát thanh / Radio 24/7 (`/radio`) phát các kênh livestream tĩnh, không cần database. **11 đài, tất cả đã kiểm chứng bằng `npm run verify:radio`:** 3 kênh Lofi Girl/Chillhop (YouTube live) + 5 kênh VOH/HTV (HLS m3u8) + 3 đài tỉnh (Hà Nội FM 96, Đà Nẵng FM 98.5, Quảng Ninh FM 97.8). Ba đài tỉnh còn lại trên trang VOH bị loại vì hỏng phía nhà đài (TLS hết hạn / sai SNI / DNS bị chặn) — xem ghi chú trong `src/music/radio.ts`.

**Architecture:** Tạo module đài phát thanh tĩnh `src/music/radio.ts` chứa danh sách các luồng phát 24/7. Lệnh `/radio` kết nối voice channel và phát ngay luồng đã chọn. Nếu không truyền kênh, hiển thị danh sách kèm menu chọn đài trực quan.

**Tech Stack:** TypeScript, discord.js v14 (SlashCommand, StringSelectMenuBuilder), lavalink-client, Vitest.

---

### Task 1: Module Radio Stations & Helpers

**Files:**
- Create: `src/music/radio.ts`
- Test: `tests/radio.test.ts`

**Interfaces:**
- `RADIO_STATIONS`: danh sách các đài tĩnh (lofi, chill, sleep, vov3, vov1)
- `findRadioStation(query: string): RadioStation | undefined`
- `buildRadioEmbed(): EmbedBuilder`
- `buildRadioSelectMenu(): ActionRowBuilder<StringSelectMenuBuilder>`

- [x] **Step 1: Viết test cho `findRadioStation` và builders**
- [x] **Step 2: Chạy test thất bại (`npm test tests/radio.test.ts`)**
- [x] **Step 3: Triển khai `src/music/radio.ts`**
- [x] **Step 4: Chạy lại test và xác nhận pass**

---

### Task 2: Lệnh `/radio` (Phát đài 24/7)

**Files:**
- Create: `src/commands/music/radio.ts`
- Modify: `src/index.ts` (xử lý sự kiện StringSelectMenu cho đài radio nếu người dùng chọn từ menu)
- Test: `tests/radio-command.test.ts`

**Interfaces:**
- Command `/radio [station]` và `!radio [station]`
- Tự kết nối voice channel của người gọi và phát stream radio

- [x] **Step 1: Viết test cho lệnh `/radio` (kiểm tra khi truyền station ID, khi không ở voice, khi tìm thấy và phát track)**
- [x] **Step 2: Chạy test thất bại (`npm test tests/radio-command.test.ts`)**
- [x] **Step 3: Triển khai `src/commands/music/radio.ts` và tích hợp select menu trong `src/index.ts`**
- [x] **Step 4: Chạy test và xác nhận pass**

---

### Task 3: Full Test & Build Verification

- [x] **Step 1: Chạy toàn bộ test suite (`npm test`)**
- [x] **Step 2: Chạy `npm run build`**
