import type { Client, EmbedBuilder } from "discord.js";
import { EMBED_COLORS, embed } from "./utils/embed.js";
import { formatDuration } from "./utils/text.js";
import { BOT_AUTHOR } from "./status.js";

/** Phan `message.mentions` can thiet de quyet dinh co tra loi hay khong. */
export interface MentionInfo {
  /** Tin nhan co @everyone hoac @here. */
  everyone: boolean;
  roles: { size: number };
  users: { has: (id: string) => boolean };
}

/**
 * Chi tra loi khi bot duoc ping truc tiep.
 * Bo qua @everyone/@here va ping role de khong ban thong tin vao moi tin nhan.
 */
export function shouldShowBotInfo(mentions: MentionInfo, botId: string): boolean {
  if (mentions.everyone || mentions.roles.size > 0) return false;
  return mentions.users.has(botId);
}

/**
 * Tin nhan bat dau bang mention bot (`<@id>` hoac `<@!id>`).
 * Tra ve phan con lai (khong co mention), hoac null neu khong phai mention bot.
 */
export function stripBotMention(content: string, botId: string): string | null {
  const match = content.match(/^\s*<@!?(\d+)>/);
  if (!match || match[1] !== botId) return null;
  return content.slice(match[0].length).trim();
}

/** The thong tin bot, gui khi co nguoi ping truc tiep vao bot. */
export function buildBotInfoEmbed(
  client: Client,
  prefix: string,
  commandCount: number
): EmbedBuilder {
  const bot = client.user;
  const guilds = client.guilds.cache.size;
  const members = client.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0);

  const builder = embed(
    `👋 | Chào bạn! Mình là **${bot?.username ?? "MusicBot"}** — bot phát nhạc cho server.\n` +
      `Dùng \`${prefix}help\` hoặc \`/help\` để xem **${commandCount}** lệnh.`,
    EMBED_COLORS.default,
    "Thông tin bot"
  ).addFields(
    { name: "🏓 | Ping", value: `\`${client.ws.ping}ms\``, inline: true },
    { name: "⏱️ | Hoạt động", value: `\`${formatDuration(client.uptime ?? 0)}\``, inline: true },
    { name: "🌐 | Server", value: `\`${guilds}\``, inline: true },
    { name: "👥 | Thành viên", value: `\`${members}\``, inline: true },
    { name: "💬 | Prefix", value: `\`${prefix}\``, inline: true },
    { name: "👤 | Tác giả", value: BOT_AUTHOR, inline: true }
  );

  const avatar = bot?.displayAvatarURL();
  if (avatar) builder.setThumbnail(avatar);
  builder.setFooter({ text: `Ví dụ: ${prefix}play con cá con chim` });
  return builder;
}
