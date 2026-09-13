import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, embed, privateReplyAndCleanup, silentReply, silentReplyAndCleanup } from "../../utils/embed.js";

const NO_PLAYER = "🚫 Mình chưa phát nhạc ở server này.";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Tạm dừng bài đang phát"),
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await privateReplyAndCleanup(interaction, embed(NO_PLAYER, EMBED_COLORS.error, "Tạm dừng"));
      return;
    }

    if (player.paused) {
      await privateReplyAndCleanup(
        interaction,
        embed("⚠️ Bài hát đã đang tạm dừng rồi.", EMBED_COLORS.default, "Tạm dừng")
      );
      return;
    }

    await player.pause();
    await interaction.reply(
      silentReply(
        embed("⏸️ Đã tạm dừng nhạc. Dùng `/resume` để phát tiếp nhé!", EMBED_COLORS.default, "Tạm dừng")
      )
    );
  },
  async executeMessage(message) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player) {
      await silentReplyAndCleanup(message, embed(NO_PLAYER, EMBED_COLORS.error, "Tạm dừng"));
      return;
    }

    if (player.paused) {
      await silentReplyAndCleanup(
        message,
        embed("⚠️ Bài hát đã đang tạm dừng rồi.", EMBED_COLORS.default, "Tạm dừng")
      );
      return;
    }

    await player.pause();
    await message.reply(
      silentReply(
        embed("⏸️ Đã tạm dừng nhạc. Dùng `!resume` để phát tiếp nhé!", EMBED_COLORS.default, "Tạm dừng")
      )
    );
  },
};
