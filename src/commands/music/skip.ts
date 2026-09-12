import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, embed, privateReplyAndCleanup, silentReply, silentReplyAndCleanup } from "../../utils/embed.js";

const NOTHING_PLAYING = "🚫 | Không có bài nào đang phát để bỏ qua.";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Bỏ qua bài hát hiện tại"),
  aliases: ["s"],
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player?.queue.current) {
      await privateReplyAndCleanup(interaction, embed(NOTHING_PLAYING, EMBED_COLORS.error, "Skip"));
      return;
    }

    const skipped = player.queue.current.info.title;
    await player.skip();
    await interaction.reply(
      silentReply(embed(`⏩ | Đã bỏ qua:\n> **${skipped}**`, EMBED_COLORS.default, "Skip"))
    );
  },
  async executeMessage(message) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player?.queue.current) {
      await silentReplyAndCleanup(message, embed(NOTHING_PLAYING, EMBED_COLORS.error, "Skip"));
      return;
    }

    const skipped = player.queue.current.info.title;
    await player.skip();
    await message.reply(
      silentReply(embed(`⏩ | Đã bỏ qua:\n> **${skipped}**`, EMBED_COLORS.default, "Skip"))
    );
  },
};
