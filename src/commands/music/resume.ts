import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, embed } from "../../utils/embed.js";

const NO_PLAYER = "Mình chưa phát nhạc ở server này. 😴";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Tiếp tục phát bài đang tạm dừng"),
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed(NO_PLAYER, EMBED_COLORS.error)],
      });
      return;
    }

    if (!player.paused) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed("Nhạc vẫn đang phát, không bị tạm dừng. ▶️", EMBED_COLORS.warning)],
      });
      return;
    }

    await player.resume();
    await interaction.reply({
      embeds: [embed("Đã phát tiếp nhạc. ▶️", EMBED_COLORS.success, "▶️ Đã tiếp tục")],
    });
  },
  async executeMessage(message) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player) {
      await message.reply({ embeds: [embed(NO_PLAYER, EMBED_COLORS.error)] });
      return;
    }

    if (!player.paused) {
      await message.reply({
        embeds: [embed("Nhạc vẫn đang phát, không bị tạm dừng. ▶️", EMBED_COLORS.warning)],
      });
      return;
    }

    await player.resume();
    await message.reply({
      embeds: [embed("Đã phát tiếp nhạc. ▶️", EMBED_COLORS.success, "▶️ Đã tiếp tục")],
    });
  },
};
