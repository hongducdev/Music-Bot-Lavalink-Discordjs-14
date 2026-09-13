import { SlashCommandBuilder } from "discord.js";
import type { RepeatMode } from "lavalink-client";
import type { Command } from "../../types/command.js";
import {
  EMBED_COLORS,
  embed,
  privateReplyAndCleanup,
  silentReply,
  silentReplyAndCleanup,
} from "../../utils/embed.js";

const NO_PLAYER = "🚫 Mình chưa phát nhạc ở server này.";

export function nextRepeatMode(current?: RepeatMode | string): RepeatMode {
  if (current === "track") return "queue";
  if (current === "queue") return "off";
  return "track";
}

export function parseRepeatMode(input?: string | null): RepeatMode | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (["track", "t", "song", "bài", "1"].includes(s)) return "track";
  if (["queue", "q", "all", "danh sách"].includes(s)) return "queue";
  if (["off", "none", "tắt", "0"].includes(s)) return "off";
  return null;
}

export function repeatModeMessage(mode: RepeatMode): string {
  switch (mode) {
    case "track":
      return "🔂 Chế độ lặp: **Lặp lại bài hiện tại**.";
    case "queue":
      return "🔁 Chế độ lặp: **Lặp lại toàn bộ hàng đợi**.";
    case "off":
    default:
      return "➡️ Chế độ lặp: **Tắt lặp lại**.";
  }
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Bật/tắt chế độ lặp lại bài hát hoặc hàng đợi")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Chế độ lặp (để trống sẽ chuyển đổi: tắt -> bài -> hàng đợi -> tắt)")
        .setRequired(false)
        .addChoices(
          { name: "Tắt lặp lại", value: "off" },
          { name: "Lặp lại bài hiện tại", value: "track" },
          { name: "Lặp lại toàn bộ hàng đợi", value: "queue" }
        )
    ),
  aliases: ["lp", "repeat"],
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await privateReplyAndCleanup(interaction, embed(NO_PLAYER, EMBED_COLORS.error, "Chế độ lặp"));
      return;
    }

    const requested = interaction.options.getString("mode");
    const targetMode = parseRepeatMode(requested) ?? nextRepeatMode(player.repeatMode);

    await player.setRepeatMode(targetMode);
    await interaction.reply(
      silentReply(embed(repeatModeMessage(targetMode), EMBED_COLORS.default, "Chế độ lặp"))
    );
  },
  async executeMessage(message, args) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player) {
      await silentReplyAndCleanup(message, embed(NO_PLAYER, EMBED_COLORS.error, "Chế độ lặp"));
      return;
    }

    const arg = args[0];
    const targetMode = parseRepeatMode(arg) ?? nextRepeatMode(player.repeatMode);

    await player.setRepeatMode(targetMode);
    await message.reply(
      silentReply(embed(repeatModeMessage(targetMode), EMBED_COLORS.default, "Chế độ lặp"))
    );
  },
};
