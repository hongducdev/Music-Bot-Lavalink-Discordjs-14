import { SlashCommandBuilder, type EmbedBuilder } from "discord.js";
import type { Player } from "lavalink-client";
import type { Command } from "../../types/command.js";
import {
  EMBED_COLORS,
  embed,
  privateReply,
  privateReplyAndCleanup,
  silentReply,
  silentReplyAndCleanup,
} from "../../utils/embed.js";
import { formatDuration, formatTrackDuration, trackLink } from "../../utils/text.js";

const PREVIEW_LIMIT = 10;

function buildQueueEmbed(player: Player): EmbedBuilder {
  const current = player.queue.current;
  const tracks = player.queue.tracks;
  const preview = tracks.slice(0, PREVIEW_LIMIT);

  let description = preview.length
    ? preview
        .map(
          (track, i) =>
            `**${i + 1}** - ${trackLink(track.info)} | \`${formatTrackDuration(track.info.duration)}\``
        )
        .join("\n")
    : "📭 | Hàng đợi trống, chưa có bài nào tiếp theo.";

  const rest = tracks.length - PREVIEW_LIMIT;
  if (rest > 0) description += `\n\n…và còn **${rest}** bài nữa.`;

  const totalMs = tracks.reduce((sum, track) => sum + (track.info.duration ?? 0), 0);

  const builder = embed(description, EMBED_COLORS.default, "Queue").addFields(
    {
      name: "> Đang phát:",
      value: current
        ? `${trackLink(current.info)} | \`${formatTrackDuration(current.info.duration)}\``
        : "Không có",
      inline: true,
    },
    { name: "> Tổng số bài:", value: `${tracks.length}`, inline: true },
    { name: "> Tổng thời gian:", value: formatDuration(totalMs), inline: true }
  );

  builder.setFooter({ text: `${tracks.length} bài trong hàng đợi` });
  if (current?.info.artworkUrl) builder.setThumbnail(current.info.artworkUrl);
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
        embed("🚫 | Hiện không có hàng đợi nào.", EMBED_COLORS.error, "Queue")
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
        embed("🚫 | Hiện không có hàng đợi nào.", EMBED_COLORS.error, "Queue")
      );
      return;
    }

    await message.reply(silentReply(buildQueueEmbed(player)));
  },
};
