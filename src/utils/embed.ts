import { EmbedBuilder } from "discord.js";
import { clip } from "./text.js";

export const EMBED_COLORS = {
  info: 0x5865f2,
  success: 0x57f287,
  warning: 0xfee75c,
  error: 0xed4245,
} as const;

const EMBED_DESCRIPTION_LIMIT = 4096;

/** Tao embed voi description da duoc cat theo gioi han cua Discord. */
export function embed(
  description: string,
  color: number = EMBED_COLORS.info,
  title?: string
): EmbedBuilder {
  const builder = new EmbedBuilder()
    .setColor(color)
    .setDescription(clip(description || "-", EMBED_DESCRIPTION_LIMIT));

  if (title) builder.setTitle(title);
  return builder;
}
