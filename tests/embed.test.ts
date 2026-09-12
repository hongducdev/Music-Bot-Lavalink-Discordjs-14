import { describe, it, expect, vi, afterEach } from "vitest";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  type Message,
  type RepliableInteraction,
} from "discord.js";
import {
  DELETE_AFTER,
  EMBED_COLORS,
  NO_PING,
  deleteAfter,
  embed,
  privateReply,
  privateReplyAndCleanup,
  setEmbedIcon,
  silentReply,
  silentReplyAndCleanup,
  MessageContainerBuilder,
} from "../src/utils/embed.js";

describe("embed (Components V2)", () => {
  it("sets description and the default pastel color as container", () => {
    const builder = embed("hello");
    const result = builder.toJSON();

    expect(result.type).toBe(17);
    expect(result.accent_color).toBe(EMBED_COLORS.default);
    expect(result.description).toBe("hello");
    expect(result.color).toBe(EMBED_COLORS.default);
    expect(result.color).toBe(0xecc5c0);
  });

  it("accepts a custom color and author name", () => {
    const result = embed("boom", EMBED_COLORS.error, "Loi").toJSON();

    expect(result.author?.name).toBe("Loi");
    expect(result.color).toBe(EMBED_COLORS.error);
    expect(result.color).toBe(0xff4949);
    expect(result.accent_color).toBe(0xff4949);
    expect(result.description).toBe("boom");
  });

  it("uses the bot avatar as author icon once it is set", () => {
    setEmbedIcon("https://cdn.example/avatar.png");
    expect(embed("hi", EMBED_COLORS.default, "Ping").toJSON().author?.icon_url).toBe(
      "https://cdn.example/avatar.png"
    );

    setEmbedIcon(null);
    expect(embed("hi", EMBED_COLORS.default, "Ping").toJSON().author?.icon_url).toBeUndefined();
  });

  it("clips the description to Discord's limit", () => {
    const result = embed("x".repeat(9000)).toJSON();

    expect(result.description!.length).toBeLessThanOrEqual(4096);
    expect(result.description!.endsWith("...")).toBe(true);
  });

  it("never sends an empty description", () => {
    expect(embed("").toJSON().description).toBe("-");
  });

  it("creates a Section component with thumbnail accessory when thumbnail is present", () => {
    const result = embed("Song title", EMBED_COLORS.default, "Now playing")
      .setThumbnail("https://i.ytimg.com/vi/abc/hqdefault.jpg")
      .toJSON();

    expect(result.type).toBe(17);
    const section = result.components.find((c: any) => c.type === 9) as any;
    expect(section).toBeDefined();
    expect(section.accessory).toEqual({
      type: 11,
      media: { url: "https://i.ytimg.com/vi/abc/hqdefault.jpg" },
    });
  });

  it("carries alt text on the thumbnail accessory and clips it to 1024", () => {
    const section = embed("Song", EMBED_COLORS.default)
      .setThumbnail("https://i.ytimg.com/vi/abc/hqdefault.jpg", "a".repeat(3000))
      .toJSON()
      .components.find((c: any) => c.type === 9) as any;

    expect(section.accessory.description.length).toBeLessThanOrEqual(1024);
    expect(section.accessory.description.endsWith("...")).toBe(true);
  });

  it("uses the third Section slot for the section note", () => {
    const section = embed("Mô tả", EMBED_COLORS.default, "Tác giả")
      .setSectionNote("🎵 Kênh · ⏱️ 3:45")
      .setThumbnail("https://x/y.png")
      .toJSON()
      .components.find((c: any) => c.type === 9) as any;

    expect(section.components.length).toBe(3);
    expect(section.components[2].content).toContain("3:45");
  });

  it("formats fields and footer with separators inside the container", () => {
    const result = embed("Queue", EMBED_COLORS.default)
      .addFields(
        { name: "Now playing", value: "Track 1", inline: true },
        { name: "Total", value: "10 tracks", inline: true }
      )
      .setFooter({ text: "Queue preview" })
      .setTimestamp()
      .toJSON();

    expect(result.type).toBe(17);
    const separators = result.components.filter((c: any) => c.type === 14);
    expect(separators.length).toBeGreaterThanOrEqual(1);

    const textDisplays = result.components.filter((c: any) => c.type === 10) as any[];
    const hasFooter = textDisplays.some((td) => td.content.includes("-# Queue preview"));
    expect(hasFooter).toBe(true);
  });

  it("gives the main blocks large separator spacing for breathing room", () => {
    const result = embed("Queue", EMBED_COLORS.default)
      .addFields({ name: "Total", value: "10 tracks", inline: false })
      .setFooter({ text: "Queue preview" })
      .toJSON();

    const separators = result.components.filter((c: any) => c.type === 14) as any[];
    // mot cai truoc khoi fields, mot cai truoc footer
    expect(separators.length).toBe(2);
    expect(separators.every((s) => s.spacing === 2)).toBe(true);
  });
});

describe("auto delete", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("deletes only after the delay has passed", async () => {
    vi.useFakeTimers();
    const remove = vi.fn().mockResolvedValue(undefined);

    deleteAfter(remove, DELETE_AFTER.error);
    await vi.advanceTimersByTimeAsync(DELETE_AFTER.error - 1);
    expect(remove).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("ignores a failed delete so a removed message cannot crash the bot", async () => {
    vi.useFakeTimers();
    const remove = vi.fn().mockRejectedValue(new Error("Unknown Message"));

    deleteAfter(remove, 1000);

    await vi.advanceTimersByTimeAsync(1000);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("keeps the now-playing card around longer than an error", () => {
    expect(DELETE_AFTER.nowPlaying).toBeGreaterThan(DELETE_AFTER.error);
  });

  it("replies ephemeral then cleans up the interaction response", async () => {
    vi.useFakeTimers();
    const reply = vi.fn().mockResolvedValue(undefined);
    const deleteReply = vi.fn().mockResolvedValue(undefined);
    const interaction = { reply, deleteReply } as unknown as RepliableInteraction;

    await privateReplyAndCleanup(interaction, embed("boom"));

    expect(reply).toHaveBeenCalledWith(
      expect.objectContaining({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      })
    );
    expect(deleteReply).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(DELETE_AFTER.error);
    expect(deleteReply).toHaveBeenCalledTimes(1);
  });

  it("replies silently then deletes the sent channel message", async () => {
    vi.useFakeTimers();
    const sent = { delete: vi.fn().mockResolvedValue(undefined) };
    const message = { reply: vi.fn().mockResolvedValue(sent) } as unknown as Message;

    await silentReplyAndCleanup(message, embed("boom"));

    expect(message.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
      })
    );
    expect(sent.delete).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(DELETE_AFTER.error);
    expect(sent.delete).toHaveBeenCalledTimes(1);
  });
});

describe("reply visibility", () => {
  it("keeps private replies ephemeral, ping-free and Components V2 enabled", () => {
    const payload = privateReply(embed("hi"));

    expect(payload.flags & MessageFlags.Ephemeral).toBe(MessageFlags.Ephemeral);
    expect(payload.flags & MessageFlags.IsComponentsV2).toBe(MessageFlags.IsComponentsV2);
    expect(payload.components).toBeDefined();
    expect(payload.components.length).toBe(1);
    expect(payload.allowedMentions).toEqual({ parse: [] });
  });

  it("groups action rows inside the container instead of detaching them", () => {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("x").setLabel("X").setStyle(ButtonStyle.Secondary)
    );

    const payload = privateReply(embed("hi"), [row]);
    expect(payload.components.length).toBe(1);

    const json = (payload.components[0] as any).toJSON();
    const rowInside = json.components.filter((c: any) => c.type === 1);
    expect(rowInside.length).toBe(1);
  });

  it("keeps public replies silent, ping-free and Components V2 enabled", () => {
    const payload = silentReply(embed("hi"));

    expect(payload.flags & MessageFlags.SuppressNotifications).toBe(
      MessageFlags.SuppressNotifications
    );
    expect(payload.flags & MessageFlags.IsComponentsV2).toBe(MessageFlags.IsComponentsV2);
    expect(payload.flags & MessageFlags.Ephemeral).toBe(0);
    expect(payload.components).toBeDefined();
    expect(payload.components.length).toBe(1);
    expect(payload.allowedMentions).toBe(NO_PING);
  });

  it("does not let a requester mention notify anyone", () => {
    const parsed = (silentReply(embed("<@42>")).allowedMentions.parse ?? []).length;

    expect(parsed).toBe(0);
  });
});
