import { ActionRowBuilder, ButtonBuilder, MessageFlags, type APIAllowedMentions, type Message, type RepliableInteraction } from "discord.js";
import { MessageContainerBuilder, type CardActionRow } from "./message-container.js";
export { EMBED_COLORS, EMBED_DESCRIPTION_LIMIT, MEDIA_DESCRIPTION_LIMIT, MessageContainerBuilder, embed } from "./message-container.js";

/** Mention trong tin nhắn vẫn hiển thị nhưng không tạo thông báo cho ai. */
export const NO_PING: APIAllowedMentions = { parse: [] };

export interface PrivateComponentPayload {
  components: MessageContainerBuilder[];
  allowedMentions: APIAllowedMentions;
  flags: number;
}

export interface SilentComponentPayload {
  components: MessageContainerBuilder[];
  allowedMentions: APIAllowedMentions;
  flags: number;
}

// Giữ lại type aliases cho code cũ tương thích
export type PrivateEmbedPayload = PrivateComponentPayload;
export type SilentEmbedPayload = SilentComponentPayload;

/** Payload chỉ người gõ lệnh nhìn thấy (Components V2 + Ephemeral). */
export function privateReply(
  builder: MessageContainerBuilder,
  components?: CardActionRow[]
): PrivateComponentPayload {
  // Nut phai nam TRONG container, neu khong se render roi ben ngoai dai accent color.
  if (components?.length) builder.addActionRows(...components);
  return {
    components: [builder],
    allowedMentions: NO_PING,
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  };
}

/** Payload công khai nhưng im lặng (Components V2 + SuppressNotifications). */
export function silentReply(
  builder: MessageContainerBuilder,
  components?: CardActionRow[]
): SilentComponentPayload {
  if (components?.length) builder.addActionRows(...components);
  return {
    components: [builder],
    allowedMentions: NO_PING,
    flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
  };
}

/** Thời gian tự xoá tin nhắn của bot: lỗi nên ngắn, bài hát dài hơn. */
export const DELETE_AFTER = {
  error: 20_000,
  nowPlaying: 120_000,
} as const;

/**
 * Hẹn xoá tin nhắn sau ms.
 * Lỗi khi xoá được bỏ qua để không làm sập bot.
 */
export function deleteAfter(remove: () => Promise<unknown>, ms: number): void {
  const timer = setTimeout(() => {
    void Promise.resolve()
      .then(remove)
      .catch(() => {});
  }, ms);
  timer.unref?.();
}

/** Trả lời ephemeral bằng Components V2 rồi tự xoá sau ms. */
export async function privateReplyAndCleanup(
  interaction: RepliableInteraction,
  builder: MessageContainerBuilder,
  ms: number = DELETE_AFTER.error,
  components?: ActionRowBuilder<ButtonBuilder>[]
): Promise<void> {
  const payload = privateReply(builder, components);
  await interaction.reply(payload);
  deleteAfter(() => interaction.deleteReply(), ms);
}

/** Reply công khai + im lặng bằng Components V2 rồi tự xoá sau ms. */
export async function silentReplyAndCleanup(
  message: Message,
  builder: MessageContainerBuilder,
  ms: number = DELETE_AFTER.error,
  components?: ActionRowBuilder<ButtonBuilder>[]
): Promise<void> {
  const payload = silentReply(builder, components);
  const sent = await message.reply(payload);
  deleteAfter(() => sent.delete(), ms);
}
