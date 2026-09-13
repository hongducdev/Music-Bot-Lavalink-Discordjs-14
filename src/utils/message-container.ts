import {
  ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, SectionBuilder,
  SeparatorBuilder, TextDisplayBuilder, ThumbnailBuilder,
  type ActionRowBuilder, type ButtonBuilder, type StringSelectMenuBuilder,
  type APIEmbedField,
} from "discord.js";
import { clip, safeHttpUrl } from "./text.js";

export const EMBED_COLORS = { default: 0x5865f2, error: 0xed4245 } as const;
export const EMBED_DESCRIPTION_LIMIT = 4000;
export const MEDIA_DESCRIPTION_LIMIT = 1024;
export type CardActionRow = ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<StringSelectMenuBuilder>;

/** Shared message layout. Method names keep command callers small; JSON is native V2 only. */
export class MessageContainerBuilder extends ContainerBuilder {
  private description: string;
  private title?: string;
  private thumbnail?: { url: string; description?: string };
  private image?: { url: string; description?: string };
  private note?: string;
  private fields: APIEmbedField[] = [];
  private footer?: string;
  private timestamp?: number;
  private rows: CardActionRow[] = [];

  constructor(description = "", color: number = EMBED_COLORS.default, title?: string) {
    super();
    this.description = description || "-";
    this.title = title;
    this.setAccentColor(color);
  }

  setDescription(description: string): this {
    this.description = description || "-";
    return this;
  }

  setThumbnail(url: string | null, description?: string): this {
    const safe = safeHttpUrl(url);
    this.thumbnail = safe ? { url: safe, description } : undefined;
    return this;
  }

  setImage(url: string | null, description?: string): this {
    const safe = safeHttpUrl(url);
    this.image = safe ? { url: safe, description } : undefined;
    return this;
  }

  setSectionNote(note: string): this {
    this.note = note;
    return this;
  }

  addFields(...fields: (APIEmbedField | APIEmbedField[])[]): this {
    this.fields.push(...fields.flat());
    return this;
  }

  setFooter(footer: { text: string }): this {
    this.footer = footer.text;
    return this;
  }

  setTimestamp(date: Date | number = Date.now()): this {
    this.timestamp = Math.floor(Number(date) / 1000);
    return this;
  }

  addActionRows(...rows: CardActionRow[]): this {
    for (const row of rows) if (!this.rows.includes(row)) this.rows.push(row);
    return this;
  }

  override toJSON(): ReturnType<ContainerBuilder["toJSON"]> {
    const card = new ContainerBuilder(this.data);
    // Bound the whole card, not just each Text Display. Keep metadata/footer readable
    // even when a provider returns an unusually long description.
    const footer = [this.footer, this.timestamp == null ? "" : `<t:${this.timestamp}:R>`]
      .filter(Boolean).join(" · ");
    const text = (value: string, limit: number) => new TextDisplayBuilder().setContent(clip(value, limit));
    const header = [
      ...(this.title ? [text(`### ${this.title}`, 180)] : []),
      text(this.description, 2200),
      ...(this.note ? [text(this.note, 400)] : []),
    ];
    if (this.thumbnail && !this.image) {
      const thumbnail = new ThumbnailBuilder().setURL(this.thumbnail.url);
      if (this.thumbnail.description) thumbnail.setDescription(clip(this.thumbnail.description, MEDIA_DESCRIPTION_LIMIT));
      card.addSectionComponents(new SectionBuilder().addTextDisplayComponents(...header).setThumbnailAccessory(thumbnail));
    } else {
      card.addTextDisplayComponents(...header);
    }
    if (this.image) {
      const item = new MediaGalleryItemBuilder().setURL(this.image.url);
      if (this.image.description) item.setDescription(clip(this.image.description, MEDIA_DESCRIPTION_LIMIT));
      card.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(item));
    }
    if (this.fields.length) {
      // Stack metadata on mobile instead of pretending V2 supports embed inline columns.
      const groups: string[] = [];
      for (const { name, value, inline } of this.fields) {
        if (!inline) groups.push(`### ${name}\n${value}`);
        else if (groups.length) groups[groups.length - 1] += `\n**${name}** ${value}`;
        else groups.push(`**${name}** ${value}`);
      }
      const used = header.reduce((sum, part) => sum + part.data.content!.length, 0);
      let remaining = 4000 - used - 220;
      for (const group of groups) {
        if (remaining < 4) break;
        const part = text(group, remaining);
        card.addSeparatorComponents(new SeparatorBuilder().setSpacing(1));
        card.addTextDisplayComponents(part);
        remaining -= part.data.content!.length;
      }
    }
    if (this.rows.length) {
      card.addSeparatorComponents(new SeparatorBuilder().setSpacing(1));
      card.addActionRowComponents(...this.rows.map(row => row.toJSON()));
    }
    if (footer) {
      card.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1));
      card.addTextDisplayComponents(text(`-# ${footer}`, 220));
    }
    const json = card.toJSON();
    const count = 1 + json.components.reduce((sum, part) => sum + 1 +
      ("components" in part ? part.components.length : 0) + ("accessory" in part ? 1 : 0), 0);
    if (count > 40) throw new RangeError("Message exceeds Discord's 40-component limit");
    return json;
  }
}

export function embed(description: string, color: number = EMBED_COLORS.default, title?: string): MessageContainerBuilder {
  return new MessageContainerBuilder(description, color, title);
}
