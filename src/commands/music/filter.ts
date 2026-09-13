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

type FilterType = "nightcore" | "bassboost" | "8d" | "vaporwave" | "karaoke" | "clear";

export async function applyFilter(player: any, type: FilterType): Promise<string> {
  switch (type) {
    case "nightcore":
      await player.filterManager.toggleNightcore();
      return "✨ Đã chuyển đổi hiệu ứng **Nightcore**.";
    case "bassboost":
      await player.filterManager.setEQPreset("BassboostMedium");
      return "💥 Đã bật hiệu ứng **Bassboost** (tăng âm trầm).";
    case "8d":
      await player.filterManager.toggleRotation();
      return "🎧 Đã chuyển đổi hiệu ứng âm thanh **8D**.";
    case "vaporwave":
      await player.filterManager.toggleVaporwave();
      return "🌊 Đã chuyển đổi hiệu ứng **Vaporwave**.";
    case "karaoke":
      await player.filterManager.toggleKaraoke();
      return "🎤 Đã chuyển đổi chế độ **Karaoke** (giảm giọng hát).";
    case "clear":
    default:
      await player.filterManager.resetFilters();
      await player.filterManager.clearEQ();
      return "🧹 Đã tắt và khôi phục âm thanh gốc.";
  }
}

export function parseFilterType(input?: string | null): FilterType | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (["nightcore", "nc"].includes(s)) return "nightcore";
  if (["bassboost", "bb", "bass"].includes(s)) return "bassboost";
  if (["8d", "rotation"].includes(s)) return "8d";
  if (["vaporwave", "vw"].includes(s)) return "vaporwave";
  if (["karaoke"].includes(s)) return "karaoke";
  if (["clear", "reset", "off", "tắt"].includes(s)) return "clear";
  return null;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("filter")
    .setDescription("Áp dụng hiệu ứng âm thanh (Bassboost, Nightcore, 8D...)")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Chọn loại hiệu ứng âm thanh")
        .setRequired(true)
        .addChoices(
          { name: "Nightcore (Tăng tốc & cao độ)", value: "nightcore" },
          { name: "Bassboost (Tăng âm trầm)", value: "bassboost" },
          { name: "8D Audio (Âm thanh xoay vòng)", value: "8d" },
          { name: "Vaporwave (Chậm rãi, hoài niệm)", value: "vaporwave" },
          { name: "Karaoke (Giảm vocal)", value: "karaoke" },
          { name: "Tắt toàn bộ hiệu ứng", value: "clear" }
        )
    ),
  aliases: ["fx"],
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await privateReplyAndCleanup(interaction, embed(NO_PLAYER, EMBED_COLORS.error, "Hiệu ứng âm thanh"));
      return;
    }

    const typeStr = interaction.options.getString("type", true) as FilterType;
    const msg = await applyFilter(player, typeStr);

    await interaction.reply(silentReply(embed(msg, EMBED_COLORS.default, "Hiệu ứng âm thanh")));
  },
  async executeMessage(message, args) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player) {
      await silentReplyAndCleanup(message, embed(NO_PLAYER, EMBED_COLORS.error, "Hiệu ứng âm thanh"));
      return;
    }

    const type = parseFilterType(args[0]);
    if (!type) {
      await silentReplyAndCleanup(
        message,
        embed(
          "⚠️ Chọn một hiệu ứng hợp lệ: `nightcore`, `bassboost`, `8d`, `vaporwave`, `karaoke`, `clear`.\n" +
            "Ví dụ: `!filter nightcore` hoặc `!filter clear`",
          EMBED_COLORS.error,
          "Hiệu ứng âm thanh"
        )
      );
      return;
    }

    const msg = await applyFilter(player, type);
    await message.reply(silentReply(embed(msg, EMBED_COLORS.default, "Hiệu ứng âm thanh")));
  },
};
