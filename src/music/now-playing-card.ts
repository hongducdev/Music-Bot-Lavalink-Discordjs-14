import { escapeMarkdown } from "discord.js";
import type { Player, Track, UnresolvedTrack } from "lavalink-client";
import { embed, EMBED_COLORS } from "../utils/embed.js";
import { artworkUrl, clip, formatDuration, formatTrackDuration, requesterName, trackLink } from "../utils/text.js";
import { isAutoplayEnabled } from "./autoplay.js";
import { buildMusicController } from "./controller.js";
import { UI_ICONS } from "../utils/ui.js";

/** Snapshot of playback position, not an interactive seek slider. */
export function playbackTimeline(position: number, duration?: number | null, live = false): string {
  if (live || formatTrackDuration(duration) === "Trực tiếp") return "🔴 Trực tiếp";
  if (!duration || !Number.isFinite(duration) || duration < 0) return "Chưa rõ thời lượng";
  const elapsed = Math.min(Math.max(Number.isFinite(position) ? position : 0, 0), duration);
  const width = 48;
  const marker = Math.round(elapsed / duration * width);
  return `\`\`\`\n${"━".repeat(marker)}●${"─".repeat(width - marker)}\n\`\`\`\n${formatDuration(elapsed)} / ${formatDuration(duration)}`;
}

/** One layout for track-start notifications and /nowplaying, including live radio. */
export function buildNowPlayingCard(player: Player, track = player.queue.current as Track | UnresolvedTrack | null | undefined) {
  const info = track?.info;
  const duration = formatTrackDuration(info?.duration);
  const live = info?.isStream || duration === "Trực tiếp";
  const timing = playbackTimeline(player.position, info?.duration, live);
  const repeat = player.repeatMode === "track" ? "Một bài" : player.repeatMode === "queue" ? "Hàng đợi" : "Tắt";
  const next = player.queue.tracks[0];
  const card = embed(
    info ? `### ${trackLink(info)}\n${escapeMarkdown(clip(info.author || "Không rõ nghệ sĩ", 120))}` : "Chưa có thông tin bài hát",
    EMBED_COLORS.music,
    player.paused ? "Đã tạm dừng" : "Đang phát"
  ).setSectionNote(`${timing}\n${UI_ICONS.volume} ${player.volume}% · Lặp: ${repeat} · Tự động phát: ${isAutoplayEnabled(player.guildId) ? "Bật" : "Tắt"}`)
    .addFields(
      { name: "Tiếp theo", value: next ? trackLink(next.info) : "Chưa có bài trong hàng đợi · thêm bằng `/play`", inline: false }
    )
    .addActionRows(buildMusicController(player))
    .setFooter({ text: `Yêu cầu bởi ${requesterName(track?.requester)} · ${player.queue.tracks.length} bài chờ · /nowplaying cập nhật tiến độ` });
  if (info) card.setImage(artworkUrl(info), `Ảnh bìa: ${info.title}`);
  return card;
}
