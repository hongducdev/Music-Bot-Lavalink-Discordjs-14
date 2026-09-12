import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import { clearActiveRadio } from "../../music/radio.js";
import { EMBED_COLORS, embed, privateReplyAndCleanup, silentReply, silentReplyAndCleanup } from "../../utils/embed.js";

const NO_PLAYER = "🚫 | Mình chưa phát nhạc ở server này.";
const STOPPED = "🔇 | Đã dừng nhạc, xoá hàng đợi và rời kênh thoại.";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Dừng phát nhạc và rời kênh thoại"),
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await privateReplyAndCleanup(interaction, embed(NO_PLAYER, EMBED_COLORS.error, "Stop"));
      return;
    }

    clearActiveRadio(interaction.guildId!);
    await player.destroy("User requested stop");
    await interaction.reply(silentReply(embed(STOPPED, EMBED_COLORS.default, "Stop")));
  },
  async executeMessage(message) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player) {
      await silentReplyAndCleanup(message, embed(NO_PLAYER, EMBED_COLORS.error, "Stop"));
      return;
    }

    clearActiveRadio(message.guildId!);
    await player.destroy("User requested stop");
    await message.reply(silentReply(embed(STOPPED, EMBED_COLORS.default, "Stop")));
  },
};
