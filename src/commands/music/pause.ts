import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, embed } from "../../utils/embed.js";

const NO_PLAYER = "Mình chưa phát nhạc ở server này. 😴";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Tạm dừng bài đang phát"),
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed(NO_PLAYER, EMBED_COLORS.error)],
      });
      return;
    }

    if (player.paused) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed("Bài hát đã đang tạm dừng rồi. ⏸️", EMBED_COLORS.warning)],
      });
      return;
    }

    await player.pause();
    await interaction.reply({
      embeds: [embed("Đã tạm dừng nhạc. Dùng `/resume` để phát tiếp nhé! ⏸️", EMBED_COLORS.success, "⏸️ Đã tạm dừng")],
    });
  },
  async executeMessage(message) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player) {
      await message.reply({ embeds: [embed(NO_PLAYER, EMBED_COLORS.error)] });
      return;
    }

    if (player.paused) {
      await message.reply({
        embeds: [embed("Bài hát đã đang tạm dừng rồi. ⏸️", EMBED_COLORS.warning)],
      });
      return;
    }

    await player.pause();
    await message.reply({
      embeds: [embed("Đã tạm dừng nhạc. Dùng `!resume` để phát tiếp nhé! ⏸️", EMBED_COLORS.success, "⏸️ Đã tạm dừng")],
    });
  },
};
