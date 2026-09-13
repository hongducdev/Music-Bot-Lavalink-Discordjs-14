import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import {
  EMBED_COLORS,
  embed,
  privateReplyAndCleanup,
  silentReply,
  silentReplyAndCleanup,
} from "../../utils/embed.js";

const NO_PLAYER = "🚫 Mình chưa phát nhạc ở server này.";
const NOT_ENOUGH_TRACKS = "⚠️ Hàng đợi cần ít nhất **2** bài để xáo trộn.";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Xáo trộn ngẫu nhiên thứ tự các bài hát trong hàng đợi"),
  aliases: ["sh"],
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await privateReplyAndCleanup(interaction, embed(NO_PLAYER, EMBED_COLORS.error, "Trộn hàng đợi"));
      return;
    }

    if (player.queue.tracks.length < 2) {
      await privateReplyAndCleanup(
        interaction,
        embed(NOT_ENOUGH_TRACKS, EMBED_COLORS.error, "Trộn hàng đợi")
      );
      return;
    }

    await player.queue.shuffle();
    await interaction.reply(
      silentReply(
        embed(
          `🔀 Đã xáo trộn **${player.queue.tracks.length}** bài hát trong hàng đợi.`,
          EMBED_COLORS.default,
          "Trộn hàng đợi"
        )
      )
    );
  },
  async executeMessage(message) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player) {
      await silentReplyAndCleanup(message, embed(NO_PLAYER, EMBED_COLORS.error, "Trộn hàng đợi"));
      return;
    }

    if (player.queue.tracks.length < 2) {
      await silentReplyAndCleanup(
        message,
        embed(NOT_ENOUGH_TRACKS, EMBED_COLORS.error, "Trộn hàng đợi")
      );
      return;
    }

    await player.queue.shuffle();
    await message.reply(
      silentReply(
        embed(
          `🔀 Đã xáo trộn **${player.queue.tracks.length}** bài hát trong hàng đợi.`,
          EMBED_COLORS.default,
          "Trộn hàng đợi"
        )
      )
    );
  },
};
