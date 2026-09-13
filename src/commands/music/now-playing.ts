import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import {
  DELETE_AFTER,
  EMBED_COLORS,
  embed,
  privateReplyAndCleanup,
  silentReplyAndCleanup,
} from "../../utils/embed.js";
import { buildNowPlayingCard } from "../../music/now-playing-card.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Xem thông tin bài hát đang phát"),
  aliases: ["np"],
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player?.queue.current) {
      await privateReplyAndCleanup(
        interaction,
        embed("🚫 Hiện không có bài nào đang phát.", EMBED_COLORS.error, "Đang phát")
      );
      return;
    }

    await privateReplyAndCleanup(
      interaction,
      buildNowPlayingCard(player),
      DELETE_AFTER.nowPlaying
    );
  },
  async executeMessage(message) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player?.queue.current) {
      await silentReplyAndCleanup(
        message,
        embed("🚫 Hiện không có bài nào đang phát.", EMBED_COLORS.error, "Đang phát")
      );
      return;
    }

    await silentReplyAndCleanup(
      message,
      buildNowPlayingCard(player),
      DELETE_AFTER.nowPlaying
    );
  },
};
