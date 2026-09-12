import { SlashCommandBuilder, MessageFlags, type EmbedBuilder } from "discord.js";
import type { Player } from "lavalink-client";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, embed } from "../../utils/embed.js";

const PREVIEW_LIMIT = 10;

function buildQueueEmbed(player: Player): EmbedBuilder {
  const current = player.queue.current;
  const tracks = player.queue.tracks.slice(0, PREVIEW_LIMIT);

  let description = current ? `🎶 **Đang phát:** ${current.info.title}\n\n` : "";

  if (tracks.length === 0) {
    description += "📭 Hàng đợi trống, chưa có bài nào tiếp theo.";
  } else {
    description += tracks
      .map((track, i) => `\`${i + 1}.\` ${track.info.title}`)
      .join("\n");
    const rest = player.queue.tracks.length - PREVIEW_LIMIT;
    if (rest > 0) description += `\n\n…và còn **${rest}** bài nữa.`;
  }

  const builder = embed(
    description,
    EMBED_COLORS.info,
    `📋 Hàng đợi — ${player.queue.tracks.length} bài chờ`
  );

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
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed("Hiện không có hàng đợi nào. 😴", EMBED_COLORS.error)],
      });
      return;
    }

    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [buildQueueEmbed(player)],
    });
  },
  async executeMessage(message) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player) {
      await message.reply({
        embeds: [embed("Hiện không có hàng đợi nào. 😴", EMBED_COLORS.error)],
      });
      return;
    }

    await message.reply({ embeds: [buildQueueEmbed(player)] });
  },
};
