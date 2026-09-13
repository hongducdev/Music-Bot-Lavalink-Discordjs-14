import { expect, it } from "vitest";
import type { Player } from "lavalink-client";
import { buildNowPlayingCard, playbackTimeline } from "../src/music/now-playing-card.js";
import { buildMusicController } from "../src/music/controller.js";
import { embed, EMBED_COLORS } from "../src/utils/embed.js";
import { cardHeading, UI_ICONS } from "../src/utils/ui.js";

it("groups artwork, title, timeline and labelled controls before next-track details", () => {
  const player = {
    guildId: "ui", paused: false, position: 30_000, volume: 80, repeatMode: "track",
    queue: { current: { info: { title: "🎵 Song", author: "Artist", duration: 60_000, artworkUrl: "https://x/cover.png" } }, tracks: [] },
  } as unknown as Player;
  const card = buildNowPlayingCard(player).toJSON();
  expect(card.accent_color).toBe(EMBED_COLORS.music);
  expect(card.components[0].type).toBe(12);
  const texts = card.components.filter(c => c.type === 10);
  expect(texts[1].content).toContain("🎵 Song"); // Provider content is not normalized like UI labels.
  expect(texts[2].content).toContain(`${"━".repeat(24)}●${"─".repeat(24)}`);
  const controls = card.components.findIndex(c => c.type === 1);
  const next = card.components.findIndex(c => c.type === 10 && c.content.includes("### Tiếp theo"));
  expect(controls).toBeLessThan(next);
  const buttons = buildMusicController(player).toJSON().components;
  expect(buttons.every(b => b.emoji?.name && b.label)).toBe(true);
  expect(buttons[3].label).toBe("Lặp bài");
  expect(buttons[3].emoji?.name).toBe(UI_ICONS.loopTrack);
});

it("bounds the timeline and does not fabricate progress for live or unknown duration", () => {
  expect(playbackTimeline(-5, 60_000)).toContain("●────────────────");
  expect(playbackTimeline(90_000, 60_000)).toContain(`${"━".repeat(48)}●`);
  expect(playbackTimeline(30_000, 60_000)).toContain("\n```\n0:30 / 1:00");
  expect(playbackTimeline(NaN, 60_000)).toContain("0:00 / 1:00");
  expect(playbackTimeline(1, 0)).toBe("🔴 Trực tiếp");
  expect(playbackTimeline(1, 60_000, true)).toBe("🔴 Trực tiếp");
  expect(playbackTimeline(1, -1)).toBe("Chưa rõ thời lượng");
  expect(playbackTimeline(1, 9_223_372_036_854_775_807)).not.toContain("●");
});

it("normalizes heading icons once and removes only decorative field-label icons", () => {
  expect(cardHeading("⏸ Đã tạm dừng")).toBe(`${UI_ICONS.pause} Đã tạm dừng`);
  expect(cardHeading("Trộn hàng đợi")).toBe(`${UI_ICONS.shuffle} Trộn hàng đợi`);
  expect(cardHeading("Dừng phát nhạc")).toBe(`${UI_ICONS.stop} Dừng phát nhạc`);
  expect(cardHeading("Ping", true)).toBe(`${UI_ICONS.error} Ping`);
  for (const title of ["Ping", "Trợ giúp", "Radio", "Thời tiết", "RPC", "Bot"]) {
    expect(cardHeading(cardHeading(title))).toBe(cardHeading(title));
  }
  const json = embed("🎵 Provider title", undefined, "Đang phát")
    .addFields({ name: "⏱️ Thời lượng", value: "1:00" }).toJSON();
  expect(JSON.stringify(json)).toContain("🎵 Provider title");
  expect(JSON.stringify(json)).toContain("### Thời lượng");
  expect(JSON.stringify(json)).not.toContain("⏱️ Thời lượng");
});
