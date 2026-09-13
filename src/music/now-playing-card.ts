import { escapeMarkdown } from "discord.js";
import type { Player, Track, UnresolvedTrack } from "lavalink-client";
import { embed } from "../utils/embed.js";
import { artworkUrl, clip, formatDuration, formatTrackDuration, requesterName, trackLink } from "../utils/text.js";
import { isAutoplayEnabled } from "./autoplay.js";
import { buildMusicController } from "./controller.js";

/** One layout for track-start notifications and /nowplaying, including live radio. */
export function buildNowPlayingCard(player: Player, track = player.queue.current as Track | UnresolvedTrack | null | undefined) {
  const info = track?.info;
  const duration = formatTrackDuration(info?.duration);
  const live = info?.isStream || duration === "Trực tiếp";
  const timing = live ? "🔴 Trực tiếp" : `${formatDuration(player.position)} / ${duration}`;
  const repeat = player.repeatMode === "track" ? "Một bài" : player.repeatMode === "queue" ? "Hàng đợi" : "Tắt";
  const next = player.queue.tracks[0];
  const card = embed(
    info ? trackLink(info) : "Chưa có thông tin bài hát",
    undefined,
    player.paused ? "⏸ Đã tạm dừng" : "Đang phát"
  ).setSectionNote(info ? escapeMarkdown(clip(info.author || "Không rõ nghệ sĩ", 120)) : "Không rõ nghệ sĩ")
    .addFields(
      { name: "Phiên nghe", value: `**${timing}**`, inline: false },
      { name: "Yêu cầu bởi", value: requesterName(track?.requester), inline: true },
      { name: "Âm lượng", value: `${player.volume}%`, inline: true },
      { name: "Lặp", value: repeat, inline: true },
      { name: "Tự động phát", value: isAutoplayEnabled(player.guildId) ? "Bật" : "Tắt", inline: true },
      { name: "Tiếp theo", value: next ? trackLink(next.info) : "Chưa có bài trong hàng đợi · thêm bằng `/play`", inline: false }
    )
    .addActionRows(buildMusicController(player))
    .setFooter({ text: `${player.queue.tracks.length} bài chờ · /queue xem danh sách · /nowplaying cập nhật` });
  if (info) card.setImage(artworkUrl(info), `Ảnh bìa: ${info.title}`);
  return card;
}
