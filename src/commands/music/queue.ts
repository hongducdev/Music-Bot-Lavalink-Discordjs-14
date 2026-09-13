import { SlashCommandBuilder } from "discord.js";
import type { Player } from "lavalink-client";
import type { Command } from "../../types/command.js";
import {
  EMBED_COLORS,
  embed,
  privateReply,
  privateReplyAndCleanup,
  silentReply,
  silentReplyAndCleanup,
  type MessageContainerBuilder,
} from "../../utils/embed.js";
import { artworkUrl, formatDuration, formatTrackDuration, trackLink } from "../../utils/text.js";

const PREVIEW_LIMIT = 10;

export function buildQueueEmbed(player: Player): MessageContainerBuilder {
  const current = player.queue.current;
  const tracks = player.queue.tracks;
  const preview = tracks.slice(0, PREVIEW_LIMIT);
  const totalMs = tracks.reduce((sum, track) =>
    sum + (formatTrackDuration(track.info.duration) === "Trực tiếp" || track.info.isStream ? 0 : (track.info.duration ?? 0)), 0);
  const hasLive = tracks.some(track => track.info.isStream || formatTrackDuration(track.info.duration) === "Trực tiếp");
  const list = preview.map((track, i) =>
    `**${i + 1}.** ${trackLink({ title: track.info.title })} · ${track.info.isStream ? "Trực tiếp" : formatTrackDuration(track.info.duration)}`
  ).join("\n");
  const remaining = Math.max(0, tracks.length - PREVIEW_LIMIT);
  const builder = embed(
    current ? trackLink(current.info) : "Chưa có bài đang phát",
    EMBED_COLORS.default,
    "Hàng đợi"
  ).setSectionNote(current ? `${player.paused ? "Đã tạm dừng" : "Đang phát"} · ${current.info.isStream ? "Trực tiếp" : formatTrackDuration(current.info.duration)}` : "Thêm bài bằng `/play`")
    .addFields({ name: "Tiếp theo", value: list || "Hàng đợi trống. Dùng `/play` để chọn bài tiếp theo." })
    .setFooter({ text: `${tracks.length} bài chờ · ${formatDuration(totalMs)}${hasLive ? " + trực tiếp" : ""}${remaining ? ` · Còn ${remaining} bài ngoài bản xem trước` : ""}` });
  if (current) builder.setThumbnail(artworkUrl(current.info), `Ảnh bìa: ${current.info.title}`);
  return builder;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Xem danh sách bài hát đang chờ"),
  aliases: ["q"],
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await privateReplyAndCleanup(
        interaction,
        embed("🚫 Hiện không có hàng đợi nào.", EMBED_COLORS.error, "Hàng đợi")
      );
      return;
    }

    await interaction.reply(privateReply(buildQueueEmbed(player)));
  },
  async executeMessage(message) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player) {
      await silentReplyAndCleanup(
        message,
        embed("🚫 Hiện không có hàng đợi nào.", EMBED_COLORS.error, "Hàng đợi")
      );
      return;
    }

    await message.reply(silentReply(buildQueueEmbed(player)));
  },
};
