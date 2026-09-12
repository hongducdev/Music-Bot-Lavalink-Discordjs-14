import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, embed } from "../../utils/embed.js";

const NOTHING_PLAYING = "Không có bài nào đang phát để bỏ qua. 🔇";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Bỏ qua bài hát hiện tại"),
  aliases: ["s"],
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player?.queue.current) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed(NOTHING_PLAYING, EMBED_COLORS.error)],
      });
      return;
    }

    const skipped = player.queue.current.info.title;
    await player.skip();
    await interaction.reply({
      embeds: [embed(`Đã bỏ qua:\n**${skipped}** ⏭️`, EMBED_COLORS.success, "⏭️ Bỏ qua")],
    });
  },
  async executeMessage(message) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player?.queue.current) {
      await message.reply({ embeds: [embed(NOTHING_PLAYING, EMBED_COLORS.error)] });
      return;
    }

    const skipped = player.queue.current.info.title;
    await player.skip();
    await message.reply({
      embeds: [embed(`Đã bỏ qua:\n**${skipped}** ⏭️`, EMBED_COLORS.success, "⏭️ Bỏ qua")],
    });
  },
};
