# Seek, Volume & Filter Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai 3 lệnh điều khiển nhạc in-memory: `/seek` (tua nhạc), `/volume` (chỉnh âm lượng), và `/filter` (bộ lọc âm thanh: bassboost, nightcore, 8d, vaporwave, reset) sử dụng API có sẵn của `lavalink-client`.

**Architecture:** Tận dụng 100% API in-memory của `lavalink-client` (`player.seek`, `player.setVolume`, `player.filterManager`) mà không dùng database.

**Tech Stack:** TypeScript, discord.js v14, lavalink-client v2.11, Vitest.

---

### Task 1: Lệnh `/seek` (Tua nhạc)

**Files:**
- Create: `src/commands/music/seek.ts`
- Test: `tests/seek.test.ts`

**Interfaces:**
- Consumes: `player.seek(ms)`, `player.position`, `player.queue.current`
- Produces: `command: Command` xuất ra cho loader `loadCommands`

- [x] **Step 1: Viết test cho hàm parse thời gian (h:mm:ss, m:ss, số giây) và lệnh seek**
- [x] **Step 2: Chạy test thất bại (`npm test tests/seek.test.ts`)**
- [x] **Step 3: Triển khai file `src/commands/music/seek.ts`**
- [x] **Step 4: Chạy lại test và xác nhận pass**

---

### Task 2: Lệnh `/volume` (Âm lượng)

**Files:**
- Create: `src/commands/music/volume.ts`
- Test: `tests/volume.test.ts`

**Interfaces:**
- Consumes: `player.setVolume(amount)`, `player.volume`
- Produces: `command: Command` xuất ra cho loader `loadCommands`

- [x] **Step 1: Viết test cho lệnh volume (xem âm lượng hiện tại, chỉnh âm lượng 1-100, chặn giá trị không hợp lệ)**
- [x] **Step 2: Chạy test thất bại (`npm test tests/volume.test.ts`)**
- [x] **Step 3: Triển khai file `src/commands/music/volume.ts`**
- [x] **Step 4: Chạy lại test và xác nhận pass**

---

### Task 3: Lệnh `/filter` (Bộ lọc âm thanh)

**Files:**
- Create: `src/commands/music/filter.ts`
- Test: `tests/filter.test.ts`

**Interfaces:**
- Consumes: `player.filterManager.toggleNightcore()`, `player.filterManager.setEQPreset()`, `player.filterManager.toggleRotation()`, `player.filterManager.toggleVaporwave()`, `player.filterManager.resetFilters()`
- Produces: `command: Command` xuất ra cho loader `loadCommands`

- [x] **Step 1: Viết test cho lệnh filter (nightcore, bassboost, 8d, vaporwave, clear)**
- [x] **Step 2: Chạy test thất bại (`npm test tests/filter.test.ts`)**
- [x] **Step 3: Triển khai file `src/commands/music/filter.ts`**
- [x] **Step 4: Chạy lại test và xác nhận pass**

---

### Task 4: Chạy toàn bộ test suite và build kiểm tra

- [x] **Step 1: Chạy `npm test` kiểm tra 100% tests pass**
- [x] **Step 2: Chạy `npm run build` xác nhận không có lỗi TypeScript**
