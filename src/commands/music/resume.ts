import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, embed, privateReplyAndCleanup, silentReply, silentReplyAndCleanup } from "../../utils/embed.js";

const NO_PLAYER = "🚫 | Mình chưa phát nhạc ở server này.";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Tiếp tục phát bài đang tạm dừng"),
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await privateReplyAndCleanup(interaction, embed(NO_PLAYER, EMBED_COLORS.error, "Resume"));
      return;
    }

    if (!player.paused) {
      await privateReplyAndCleanup(
        interaction,
        embed("⚠️ | Nhạc vẫn đang phát, không bị tạm dừng.", EMBED_COLORS.default, "Resume")
      );
      return;
    }

    await player.resume();
    await interaction.reply(
      silentReply(embed("⏯️ | Đã phát tiếp nhạc.", EMBED_COLORS.default, "Resume"))
    );
  },
  async executeMessage(message) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player) {
      await silentReplyAndCleanup(message, embed(NO_PLAYER, EMBED_COLORS.error, "Resume"));
      return;
    }

    if (!player.paused) {
      await silentReplyAndCleanup(
        message,
        embed("⚠️ | Nhạc vẫn đang phát, không bị tạm dừng.", EMBED_COLORS.default, "Resume")
      );
      return;
    }

    await player.resume();
    await message.reply(
      silentReply(embed("⏯️ | Đã phát tiếp nhạc.", EMBED_COLORS.default, "Resume"))
    );
  },
};
