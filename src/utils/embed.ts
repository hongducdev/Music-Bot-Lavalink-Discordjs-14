import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  MessageFlags,
  type APIAllowedMentions,
  type Message,
  type RepliableInteraction,
} from "discord.js";
import { clip } from "./text.js";

/** Palette lay tu repo tham khao Music-Bot-Discord.js-v14. */
export const EMBED_COLORS = {
  default: 0xecc5c0,
  error: 0xff4949,
} as const;

const EMBED_DESCRIPTION_LIMIT = 4096;

let botIconURL: string | null = null;

/** Goi mot lan khi bot ready de moi embed co avatar bot lam icon author. */
export function setEmbedIcon(url: string | null): void {
  botIconURL = url;
}

/** Tao embed theo style repo tham khao: author + icon bot, description dang "emoji | noi dung". */
export function embed(
  description: string,
  color: number = EMBED_COLORS.default,
  author?: string
): EmbedBuilder {
  const builder = new EmbedBuilder()
    .setColor(color)
    .setDescription(clip(description || "-", EMBED_DESCRIPTION_LIMIT));

  if (author) builder.setAuthor({ name: author, iconURL: botIconURL ?? undefined });
  return builder;
}

/** Mention trong embed van hien thi nhung khong tao thong bao cho ai. */
export const NO_PING: APIAllowedMentions = { parse: [] };

export interface PrivateEmbedPayload {
  embeds: EmbedBuilder[];
  allowedMentions: APIAllowedMentions;
  flags: MessageFlags.Ephemeral;
}

export interface SilentEmbedPayload {
  embeds: EmbedBuilder[];
  allowedMentions: APIAllowedMentions;
  flags: MessageFlags.SuppressNotifications;
}

/** Payload chi nguoi go lenh nhin thay (slash command). */
export function privateReply(builder: EmbedBuilder): PrivateEmbedPayload {
  return { embeds: [builder], allowedMentions: NO_PING, flags: MessageFlags.Ephemeral };
}

/** Payload cong khai nhung im lang: khong ping ai, khong push notification. */
export function silentReply(builder: EmbedBuilder): SilentEmbedPayload {
  return {
    embeds: [builder],
    allowedMentions: NO_PING,
    flags: MessageFlags.SuppressNotifications,
  };
}

/** Thoi gian tu xoa tin nhan cua bot: loi nen ngan, the bai hat can lau hon cho kip doc. */
export const DELETE_AFTER = {
  error: 20_000,
  nowPlaying: 120_000,
} as const;

/**
 * Hen xoa tin nhan cua bot sau ms.
 * Loi khi xoa (tin da bi xoa tay, bot bi thu quyen) duoc bo qua de khong lam sap bot.
 */
export function deleteAfter(remove: () => Promise<unknown>, ms: number): void {
  const timer = setTimeout(() => {
    void Promise.resolve()
      .then(remove)
      .catch(() => {});
  }, ms);
  timer.unref?.();
}

/** Tra loi ephemeral roi tu xoa sau ms. */
export async function privateReplyAndCleanup(
  interaction: RepliableInteraction,
  builder: EmbedBuilder,
  ms: number = DELETE_AFTER.error,
  components?: ActionRowBuilder<ButtonBuilder>[]
): Promise<void> {
  const payload = {
    ...privateReply(builder),
    ...(components?.length ? { components } : {}),
  };
  await interaction.reply(payload);
  deleteAfter(() => interaction.deleteReply(), ms);
}

/** Reply cong khai + im lang roi tu xoa sau ms. */
export async function silentReplyAndCleanup(
  message: Message,
  builder: EmbedBuilder,
  ms: number = DELETE_AFTER.error,
  components?: ActionRowBuilder<ButtonBuilder>[]
): Promise<void> {
  const payload = {
    ...silentReply(builder),
    ...(components?.length ? { components } : {}),
  };
  const sent = await message.reply(payload);
  deleteAfter(() => sent.delete(), ms);
}
