import {
  ActionRowBuilder,
  ButtonBuilder,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
  type APIAllowedMentions,
  type APIEmbedField,
  type Message,
  type RepliableInteraction,
} from "discord.js";
import { clip } from "./text.js";

/** Palette lấy từ theme bot: default pastel và error red. */
export const EMBED_COLORS = {
  default: 0xecc5c0,
  error: 0xff4949,
} as const;

export const EMBED_DESCRIPTION_LIMIT = 4000;
/** Alt text cua Thumbnail/MediaGallery item theo gioi han API. */
export const MEDIA_DESCRIPTION_LIMIT = 1024;

let botIconURL: string | null = null;

/** Gọi một lần khi bot ready để botIconURL sẵn sàng làm icon. */
export function setEmbedIcon(url: string | null): void {
  botIconURL = url;
}

export function getEmbedIcon(): string | null {
  return botIconURL;
}

export interface ContainerAuthor {
  name: string;
  iconURL?: string;
  icon_url?: string;
}

export interface ContainerFooter {
  text: string;
}

/**
 * MessageContainerBuilder: Tạo layout tin nhắn Discord Components V2 thay thế EmbedBuilder.
 * Kế thừa ContainerBuilder của discord.js v14.
 */
export class MessageContainerBuilder extends ContainerBuilder {
  description: string;
  color?: number;
  author?: ContainerAuthor;
  thumbnail?: string | null;
  thumbnailDescription?: string;
  fields: APIEmbedField[];
  footer?: ContainerFooter;
  timestamp?: Date | number | null;
  actionRows: ActionRowBuilder<any>[];
  /** Dong thu 3 cua Section (Section cho phep 1-3 text display). */
  sectionNote?: string;

  constructor(
    description: string = "",
    color: number = EMBED_COLORS.default,
    author?: string
  ) {
    super();
    this.description = clip(description || "-", EMBED_DESCRIPTION_LIMIT);
    this.color = color;
    this.author = author
      ? {
          name: author,
          iconURL: botIconURL ?? undefined,
          icon_url: botIconURL ?? undefined,
        }
      : undefined;
    this.fields = [];
    this.thumbnail = null;
    this.thumbnailDescription = undefined;
    this.footer = undefined;
    this.timestamp = null;
    this.actionRows = [];
    this.sectionNote = undefined;
  }

  setColor(color: number): this {
    this.color = color;
    return this;
  }

  setDescription(description: string): this {
    this.description = clip(description || "-", EMBED_DESCRIPTION_LIMIT);
    return this;
  }

  setAuthor(options: string | { name: string; iconURL?: string }): this {
    if (typeof options === "string") {
      this.author = {
        name: options,
        iconURL: botIconURL ?? undefined,
        icon_url: botIconURL ?? undefined,
      };
    } else {
      this.author = {
        name: options.name,
        iconURL: options.iconURL,
        icon_url: options.iconURL,
      };
    }
    return this;
  }

  /** `description` la alt text cho trinh doc man hinh, khong hien thi thi giac. */
  setThumbnail(url: string | null, description?: string): this {
    this.thumbnail = url;
    this.thumbnailDescription = description;
    return this;
  }

  /** Dong bo sung di kem tieu de, chi co tac dung khi co thumbnail. */
  setSectionNote(note: string): this {
    this.sectionNote = note;
    return this;
  }

  addFields(...fields: (APIEmbedField | APIEmbedField[])[]): this {
    const flat = Array.isArray(fields[0]) ? fields[0] : (fields as APIEmbedField[]);
    this.fields.push(...flat);
    return this;
  }

  setFooter(footer: { text: string }): this {
    this.footer = footer;
    return this;
  }

  setTimestamp(date: Date | number = new Date()): this {
    this.timestamp = date;
    return this;
  }

  addActionRows(...rows: ActionRowBuilder<any>[]): this {
    this.actionRows.push(...rows);
    return this;
  }

  buildComponents(): void {
    this.components.length = 0;

    if (this.color != null) {
      this.setAccentColor(this.color);
    }

    if (this.thumbnail) {
      const section = new SectionBuilder();
      const textDisplays: TextDisplayBuilder[] = [];
      if (this.author?.name) {
        textDisplays.push(new TextDisplayBuilder().setContent(`### ${this.author.name}`));
      }
      if (this.description) {
        textDisplays.push(
          new TextDisplayBuilder().setContent(clip(this.description, EMBED_DESCRIPTION_LIMIT))
        );
      }
      // Slot thu 3 giup khoi text cao bang thumbnail, anh khong bi lech len tren.
      if (this.sectionNote) {
        textDisplays.push(
          new TextDisplayBuilder().setContent(clip(this.sectionNote, EMBED_DESCRIPTION_LIMIT))
        );
      }
      if (!textDisplays.length) {
        textDisplays.push(new TextDisplayBuilder().setContent(" "));
      }
      section.addTextDisplayComponents(...textDisplays);

      const thumbnail = new ThumbnailBuilder({ media: { url: this.thumbnail } });
      if (this.thumbnailDescription) {
        thumbnail.setDescription(clip(this.thumbnailDescription, MEDIA_DESCRIPTION_LIMIT));
      }
      section.setThumbnailAccessory(thumbnail);
      this.addSectionComponents(section);
    } else {
      if (this.author?.name) {
        this.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${this.author.name}`));
      }
      if (this.description) {
        this.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(clip(this.description, EMBED_DESCRIPTION_LIMIT))
        );
      }
      if (this.sectionNote) {
        this.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(clip(this.sectionNote, EMBED_DESCRIPTION_LIMIT))
        );
      }
    }

    // Ranh gioi giua cac khoi chinh dung spacing lon cho de doc; chi tiet nho giu spacing nho.
    if (this.fields.length > 0) {
      this.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large)
      );
      this.addTextDisplayComponents(new TextDisplayBuilder().setContent(this.formatFields()));
    }

    const footerParts: string[] = [];
    if (this.footer?.text) footerParts.push(this.footer.text);
    if (this.timestamp) {
      const ms = typeof this.timestamp === "number" ? this.timestamp : this.timestamp.getTime();
      footerParts.push(`<t:${Math.floor(ms / 1000)}:R>`);
    }
    if (footerParts.length > 0) {
      this.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large)
      );
      this.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${footerParts.join(" • ")}`));
    }

    if (this.actionRows.length > 0) {
      this.addActionRowComponents(...this.actionRows);
    }
  }

  private formatFields(): string {
    const parts: string[] = [];
    let inlineGroup: APIEmbedField[] = [];

    for (const f of this.fields) {
      if (f.inline) {
        inlineGroup.push(f);
        if (inlineGroup.length === 3) {
          parts.push(
            inlineGroup
              .map((item) => (item.name.startsWith(">") ? `${item.name} ${item.value}` : `**${item.name}**: ${item.value}`))
              .join("  •  ")
          );
          inlineGroup = [];
        }
      } else {
        if (inlineGroup.length > 0) {
          parts.push(
            inlineGroup
              .map((item) => (item.name.startsWith(">") ? `${item.name} ${item.value}` : `**${item.name}**: ${item.value}`))
              .join("  •  ")
          );
          inlineGroup = [];
        }
        const title = f.name.startsWith(">") ? f.name : `**${f.name}**`;
        parts.push(`${title}\n${f.value}`);
      }
    }

    if (inlineGroup.length > 0) {
      parts.push(
        inlineGroup
          .map((item) => (item.name.startsWith(">") ? `${item.name} ${item.value}` : `**${item.name}**: ${item.value}`))
          .join("  •  ")
      );
    }

    return parts.join("\n\n");
  }

  override toJSON(): ReturnType<ContainerBuilder["toJSON"]> & {
    description?: string;
    color?: number;
    author?: ContainerAuthor;
    fields?: APIEmbedField[];
    footer?: ContainerFooter;
    thumbnail?: { url: string } | null;
  } {
    this.buildComponents();
    const res = super.toJSON();
    Object.defineProperties(res, {
      description: { value: this.description, enumerable: false },
      color: { value: this.color, enumerable: false },
      author: { value: this.author, enumerable: false },
      fields: { value: this.fields, enumerable: false },
      footer: { value: this.footer, enumerable: false },
      thumbnail: { value: this.thumbnail ? { url: this.thumbnail } : undefined, enumerable: false },
    });
    return res as any;
  }
}

/** Tạo container Components V2 theo style author + accent color + description. */
export function embed(
  description: string,
  color: number = EMBED_COLORS.default,
  author?: string
): MessageContainerBuilder {
  return new MessageContainerBuilder(description, color, author);
}

/** Mention trong tin nhắn vẫn hiển thị nhưng không tạo thông báo cho ai. */
export const NO_PING: APIAllowedMentions = { parse: [] };

export interface PrivateComponentPayload {
  components: (MessageContainerBuilder | ActionRowBuilder<any>)[];
  allowedMentions: APIAllowedMentions;
  flags: number;
}

export interface SilentComponentPayload {
  components: (MessageContainerBuilder | ActionRowBuilder<any>)[];
  allowedMentions: APIAllowedMentions;
  flags: number;
}

// Giữ lại type aliases cho code cũ tương thích
export type PrivateEmbedPayload = PrivateComponentPayload;
export type SilentEmbedPayload = SilentComponentPayload;

/** Payload chỉ người gõ lệnh nhìn thấy (Components V2 + Ephemeral). */
export function privateReply(
  builder: MessageContainerBuilder,
  components?: ActionRowBuilder<any>[]
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
  components?: ActionRowBuilder<any>[]
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
