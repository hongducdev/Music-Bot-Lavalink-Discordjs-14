import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  type Client,
} from "discord.js";
import { EMBED_COLORS, embed, type MessageContainerBuilder } from "./utils/embed.js";
import { REQUIRED_TEXT_PERMISSIONS, REQUIRED_VOICE_PERMISSIONS } from "./utils/permissions.js";
import { formatDuration } from "./utils/text.js";
import { BOT_AUTHOR } from "./status.js";

/** Quyen bot can de chay du tinh nang; khong xin Administrator. */
const INVITE_PERMISSIONS = PermissionsBitField.resolve([
  "ViewChannel",
  ...REQUIRED_TEXT_PERMISSIONS,
  ...REQUIRED_VOICE_PERMISSIONS,
]);

/** Link moi bot voi dung quyen can thiet, kem scope dang ky slash command. */
export function inviteUrl(botId: string): string {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", botId);
  url.searchParams.set("scope", "bot applications.commands");
  url.searchParams.set("permissions", INVITE_PERMISSIONS.toString());
  return url.toString();
}

/** Nut "Mời bot" duoi embed; nut Link khong can xu ly interaction. */
export function inviteButton(botId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Mời bot").setURL(inviteUrl(botId))
  );
}

/** Phan `message.mentions` can thiet de quyet dinh co tra loi hay khong. */
export interface MentionInfo {
  /** Tin nhan co @everyone hoac @here. */
  everyone: boolean;
  roles: { size: number };
  /**
   * `message.mentions.users`: moi user Discord coi la co mention.
   * LUU Y: gom ca tac gia tin nhan duoc reply, du noi dung khong he ping.
   */
  users: { has: (id: string) => boolean };
  /** `message.mentions.parsedUsers`: chi cac token ping thuc su nam trong noi dung. */
  parsedUsers: { has: (id: string) => boolean };
}

/**
 * Chi tra loi khi bot duoc ping truc tiep.
 * Bo qua @everyone/@here va ping role de khong ban thong tin vao moi tin nhan.
 *
 * Phai doi chieu them `parsedUsers`: khi ai do reply tin nhan cua bot, Discord tu them
 * tac gia tin nhan duoc reply vao `mentions.users` du noi dung khong he ping. Chi dua vao
 * `users` se khien bot gioi thieu thong tin moi lan bi reply.
 */
export function shouldShowBotInfo(mentions: MentionInfo, botId: string): boolean {
  if (mentions.everyone || mentions.roles.size > 0) return false;
  return mentions.users.has(botId) && mentions.parsedUsers.has(botId);
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
): MessageContainerBuilder {
  const bot = client.user;
  const guilds = client.guilds.cache.size;
  const members = client.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0);

  const builder = embed(
    `Nhạc cho những lúc ở cùng nhau.\n` +
      `Vào kênh thoại, dùng \`/play\` để chọn bài hoặc \`/radio\` để nghe liên tục.`,
    EMBED_COLORS.default,
    bot?.username ?? "MusicBot"
  ).setSectionNote(`\`/help\` · ${commandCount} lệnh · prefix \`${prefix}\``).addFields(
    { name: "Kết nối", value: `${client.ws.ping < 0 ? "Đang đo" : `${client.ws.ping} ms`} · hoạt động ${formatDuration(client.uptime ?? 0)}`, inline: true },
    { name: "Cộng đồng", value: `${guilds} server · ${members} thành viên`, inline: true },
    { name: "Tác giả", value: BOT_AUTHOR, inline: true }
  );

  const avatar = bot?.displayAvatarURL();
  if (avatar) builder.setThumbnail(avatar, `Ảnh đại diện của ${bot?.username ?? "MusicBot"}`);
  builder.setFooter({ text: `Ví dụ: ${prefix}play con cá con chim` });
  return builder;
}
