import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import {
  EMBED_COLORS,
  embed,
  privateReplyAndCleanup,
  silentReply,
  silentReplyAndCleanup,
} from "../../utils/embed.js";
import { formatDuration, formatTrackDuration } from "../../utils/text.js";

const NO_PLAYER = "🚫 Mình chưa phát nhạc ở server này.";
const NO_TRACK = "🚫 Không có bài nào đang phát để tua.";

export function parseTimeToMs(input?: string | null): number | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (!s || s.startsWith("-")) return null;

  if (/[hms]/.test(s)) {
    const hours = s.match(/(\d+)\s*h/)?.[1];
    const mins = s.match(/(\d+)\s*m/)?.[1];
    const secs = s.match(/(\d+)\s*s/)?.[1];
    if (!hours && !mins && !secs) return null;
    const totalSecs =
      (hours ? parseInt(hours, 10) * 3600 : 0) +
      (mins ? parseInt(mins, 10) * 60 : 0) +
      (secs ? parseInt(secs, 10) : 0);
    return totalSecs * 1000;
  }

  if (s.includes(":")) {
    const parts = s.split(":").map((p) => p.trim());
    if (parts.some((p) => !/^\d+$/.test(p))) return null;
    if (parts.length === 2) {
      const [m, sec] = parts.map(Number);
      return (m * 60 + sec) * 1000;
    }
    if (parts.length === 3) {
      const [h, m, sec] = parts.map(Number);
      return (h * 3600 + m * 60 + sec) * 1000;
    }
    return null;
  }

  if (/^\d+$/.test(s)) {
    return parseInt(s, 10) * 1000;
  }

  return null;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("seek")
    .setDescription("Tua bài hát tới thời gian mong muốn (ví dụ: 1:30 hoặc 90)")
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription("Thời gian cần tua tới (ví dụ: 1:30, 90, 2m, 1h15m)")
        .setRequired(true)
    ),
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      await privateReplyAndCleanup(interaction, embed(NO_PLAYER, EMBED_COLORS.error, "Tua bài hát"));
      return;
    }

    const current = player.queue.current;
    if (!current) {
      await privateReplyAndCleanup(interaction, embed(NO_TRACK, EMBED_COLORS.error, "Tua bài hát"));
      return;
    }

    if (current.info.isStream || !current.info.duration) {
      await privateReplyAndCleanup(
        interaction,
        embed("⚠️ Không thể tua bài hát đang phát trực tiếp.", EMBED_COLORS.error, "Tua bài hát")
      );
      return;
    }

    const timeStr = interaction.options.getString("time", true);
    const targetMs = parseTimeToMs(timeStr);

    if (targetMs === null) {
      await privateReplyAndCleanup(
        interaction,
        embed("⚠️ Định dạng thời gian không hợp lệ. Ví dụ: `1:30` hoặc `90`.", EMBED_COLORS.error, "Tua bài hát")
      );
      return;
    }

    if (targetMs > current.info.duration) {
      await privateReplyAndCleanup(
        interaction,
        embed(
          `⚠️ Vị trí tua vượt quá thời lượng bài hát (${formatTrackDuration(current.info.duration)}).`,
          EMBED_COLORS.error,
          "Tua bài hát"
        )
      );
      return;
    }

    await player.seek(targetMs);
    await interaction.reply(
      silentReply(
        embed(
          `⏩ Đã tua tới: \`${formatDuration(targetMs)}\` / \`${formatTrackDuration(current.info.duration)}\``,
          EMBED_COLORS.default,
          "Tua bài hát"
        )
      )
    );
  },
  async executeMessage(message, args) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player) {
      await silentReplyAndCleanup(message, embed(NO_PLAYER, EMBED_COLORS.error, "Tua bài hát"));
      return;
    }

    const current = player.queue.current;
    if (!current) {
      await silentReplyAndCleanup(message, embed(NO_TRACK, EMBED_COLORS.error, "Tua bài hát"));
      return;
    }

    if (current.info.isStream || !current.info.duration) {
      await silentReplyAndCleanup(
        message,
        embed("⚠️ Không thể tua bài hát đang phát trực tiếp.", EMBED_COLORS.error, "Tua bài hát")
      );
      return;
    }

    const timeStr = args.join(" ").trim();
    const targetMs = parseTimeToMs(timeStr);

    if (targetMs === null) {
      await silentReplyAndCleanup(
        message,
        embed("✍️ Nhập thời gian cần tua nhé. Ví dụ: `!seek 1:30` hoặc `!seek 90`.", EMBED_COLORS.error, "Tua bài hát")
      );
      return;
    }

    if (targetMs > current.info.duration) {
      await silentReplyAndCleanup(
        message,
        embed(
          `⚠️ Vị trí tua vượt quá thời lượng bài hát (${formatTrackDuration(current.info.duration)}).`,
          EMBED_COLORS.error,
          "Tua bài hát"
        )
      );
      return;
    }

    await player.seek(targetMs);
    await message.reply(
      silentReply(
        embed(
          `⏩ Đã tua tới: \`${formatDuration(targetMs)}\` / \`${formatTrackDuration(current.info.duration)}\``,
          EMBED_COLORS.default,
          "Tua bài hát"
        )
      )
    );
  },
};
