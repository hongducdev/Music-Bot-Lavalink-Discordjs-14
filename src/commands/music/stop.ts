import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, embed } from "../../utils/embed.js";

const NO_PLAYER = "Mình chưa phát nhạc ở server này. 😴";
const STOPPED = "Đã dừng nhạc, xoá hàng đợi và rời kênh thoại. 👋";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Dừng phát nhạc và rời kênh thoại"),
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed(NO_PLAYER, EMBED_COLORS.error)],
      });
      return;
    }

    await player.destroy("User requested stop");
    await interaction.reply({ embeds: [embed(STOPPED, EMBED_COLORS.success, "⏹️ Đã dừng")] });
  },
  async executeMessage(message) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player) {
      await message.reply({ embeds: [embed(NO_PLAYER, EMBED_COLORS.error)] });
      return;
    }

    await player.destroy("User requested stop");
    await message.reply({ embeds: [embed(STOPPED, EMBED_COLORS.success, "⏹️ Đã dừng")] });
  },
};
