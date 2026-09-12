import { SlashCommandBuilder, MessageFlags, type EmbedBuilder } from "discord.js";
import type { Player } from "lavalink-client";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, embed } from "../../utils/embed.js";

function buildNowPlayingEmbed(player: Player): EmbedBuilder {
  const current = player.queue.current!;

  const builder = embed(
    `**${current.info.title}**\n👤 ${current.info.author || "Không rõ"}\n🔗 [Mở bài hát](${current.info.uri})`,
    EMBED_COLORS.success,
    "🎧 Đang phát"
  );

  if (current.info.artworkUrl) builder.setThumbnail(current.info.artworkUrl);
  return builder;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Xem thông tin bài hát đang phát"),
  aliases: ["np"],
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player?.queue.current) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed("Hiện không có bài nào đang phát. 🔇", EMBED_COLORS.error)],
      });
      return;
    }

    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [buildNowPlayingEmbed(player)],
    });
  },
  async executeMessage(message) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player?.queue.current) {
      await message.reply({
        embeds: [embed("Hiện không có bài nào đang phát. 🔇", EMBED_COLORS.error)],
      });
      return;
    }

    await message.reply({ embeds: [buildNowPlayingEmbed(player)] });
  },
};
