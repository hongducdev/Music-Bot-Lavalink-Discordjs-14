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
const MIN_VOLUME = 1;
const MAX_VOLUME = 100;

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Xem hoặc điều chỉnh âm lượng phát nhạc (1 - 100%)")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Mức âm lượng từ 1 đến 100")
        .setMinValue(MIN_VOLUME)
        .setMaxValue(MAX_VOLUME)
        .setRequired(false)
    ),
  aliases: ["vol", "v"],
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await privateReplyAndCleanup(interaction, embed(NO_PLAYER, EMBED_COLORS.error, "Âm lượng"));
      return;
    }

    const amount = interaction.options.getInteger("amount");
    if (amount === null) {
      await interaction.reply(
        silentReply(
          embed(`🔊 Âm lượng hiện tại: **${player.volume}%**`, EMBED_COLORS.default, "Âm lượng")
        )
      );
      return;
    }

    await player.setVolume(amount);
    await interaction.reply(
      silentReply(embed(`🔊 Đã chỉnh âm lượng thành: **${amount}%**`, EMBED_COLORS.default, "Âm lượng"))
    );
  },
  async executeMessage(message, args) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player) {
      await silentReplyAndCleanup(message, embed(NO_PLAYER, EMBED_COLORS.error, "Âm lượng"));
      return;
    }

    if (!args.length) {
      await message.reply(
        silentReply(
          embed(`🔊 Âm lượng hiện tại: **${player.volume}%**`, EMBED_COLORS.default, "Âm lượng")
        )
      );
      return;
    }

    const parsed = parseInt(args[0], 10);
    if (isNaN(parsed) || parsed < MIN_VOLUME || parsed > MAX_VOLUME) {
      await silentReplyAndCleanup(
        message,
        embed(
          `⚠️ Vui lòng nhập mức âm lượng từ **${MIN_VOLUME}** đến **${MAX_VOLUME}**%. Ví dụ: \`!volume 80\``,
          EMBED_COLORS.error,
          "Âm lượng"
        )
      );
      return;
    }

    await player.setVolume(parsed);
    await message.reply(
      silentReply(embed(`🔊 Đã chỉnh âm lượng thành: **${parsed}%**`, EMBED_COLORS.default, "Âm lượng"))
    );
  },
};
