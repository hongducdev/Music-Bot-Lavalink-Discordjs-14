# Loop, Shuffle & Music Controller Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai 2 lệnh nhạc in-memory (`/loop`, `/shuffle`) và thanh nút bấm tương tác (Discord Buttons) điều khiển nhạc trực tiếp dưới card "Now Playing" mà không cần database.

**Architecture:** Tận dụng 100% API in-memory của `lavalink-client` (`player.setRepeatMode`, `player.queue.shuffle`, `player.pause`, `player.resume`, `player.skip`, `player.destroy`) và component Discord Buttons (`ActionRowBuilder<ButtonBuilder>`). Gắn controller vào sự kiện `trackStart` và lệnh `/nowplaying`. Lắng nghe `interaction.isButton()` trong `src/index.ts` để dispatch hành động an toàn có kiểm tra kênh thoại.

**Tech Stack:** TypeScript, discord.js v14, lavalink-client v2.11, Vitest.

---

### Task 1: Lệnh `/loop` (Lặp bài hát / hàng đợi)

**Files:**
- Create: `src/commands/music/loop.ts`
- Test: `tests/loop.test.ts`

**Interfaces:**
- Consumes: `player.setRepeatMode("off" | "track" | "queue")`, `player.repeatMode`
- Produces: `command: Command` xuất ra cho loader `loadCommands`

- [x] **Step 1: Viết test cho logic cycle và parse tham số chế độ lặp**
- [x] **Step 2: Chạy test thất bại (`npm test tests/loop.test.ts`)**
- [x] **Step 3: Triển khai file `src/commands/music/loop.ts`**
- [x] **Step 4: Chạy lại test và xác nhận 100% pass**

---

### Task 2: Lệnh `/shuffle` (Xáo trộn hàng đợi)

**Files:**
- Create: `src/commands/music/shuffle.ts`
- Test: `tests/shuffle.test.ts`

**Interfaces:**
- Consumes: `player.queue.shuffle()`, `player.queue.tracks`
- Produces: `command: Command` xuất ra cho loader `loadCommands`

- [x] **Step 1: Viết test cho lệnh `/shuffle` (kiểm tra hàng đợi < 2 bài và khi xáo trộn thành công)**
- [x] **Step 2: Chạy test thất bại (`npm test tests/shuffle.test.ts`)**
- [x] **Step 3: Triển khai file `src/commands/music/shuffle.ts`**
- [x] **Step 4: Chạy lại test và xác nhận 100% pass**

---

### Task 3: Music Controller Buttons & Event Handler

**Files:**
- Create: `src/music/controller.ts`
- Modify: `src/music/player.ts` (gắn components vào card thông báo `trackStart`)
- Modify: `src/commands/music/now-playing.ts` (gắn components vào card `/nowplaying`)
- Modify: `src/index.ts` (xử lý `interaction.isButton()`)
- Test: `tests/controller.test.ts`

**Interfaces:**
- `buildMusicController(player?: Player): ActionRowBuilder<ButtonBuilder>`
- `handleMusicButton(interaction: ButtonInteraction): Promise<boolean>`

- [x] **Step 1: Viết test cho `buildMusicController` và `handleMusicButton` (kiểm tra voice channel guard, các nút play/pause, skip, shuffle, loop, stop)**
- [x] **Step 2: Chạy test thất bại (`npm test tests/controller.test.ts`)**
- [x] **Step 3: Triển khai `src/music/controller.ts`**
- [x] **Step 4: Tích hợp vào `src/music/player.ts`, `src/commands/music/now-playing.ts`, và `src/index.ts`**
- [x] **Step 5: Chạy full test suite (`npm test`) và xác nhận mọi test đều pass**
