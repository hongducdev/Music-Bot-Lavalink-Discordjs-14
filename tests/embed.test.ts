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
  silentReply,
  silentReplyAndCleanup,
  MessageContainerBuilder,
} from "../src/utils/embed.js";

describe("native Components V2 cards", () => {
  it("serializes native components without legacy embed properties", () => {
    const json = embed("hello", EMBED_COLORS.default, "Title").toJSON();
    expect(json).toEqual({ type: 17, accent_color: 0xecc5c0, components: [
      { type: 10, content: "### ℹ️ Title" }, { type: 10, content: "hello" }
    ] });
    expect(Object.getOwnPropertyNames(json)).not.toContain("description");
    expect(embed("boom", EMBED_COLORS.error).toJSON().accent_color).toBe(0xff4949);
  });

  it("never sends empty text and bounds descriptions", () => {
    expect(embed("").toJSON().components[0]).toEqual({ type: 10, content: "-" });
    const part = embed("x".repeat(9000)).toJSON().components[0] as any;
    expect(part.content.length).toBeLessThanOrEqual(4000);
    expect(part.content.endsWith("...")).toBe(true);
  });

  it("uses a thumbnail section with three text displays and accessible alt text", () => {
    const json = embed("Song", undefined, "Playing").setSectionNote("Artist · 3:45")
      .setThumbnail("https://x/y.png", "a".repeat(3000)).toJSON();
    const section = json.components[0] as any;
    expect(section.type).toBe(9);
    expect(section.components).toHaveLength(3);
    expect(section.components[2].content).toContain("3:45");
    expect(section.accessory.media.url).toBe("https://x/y.png");
    expect(section.accessory.description.length).toBe(1024);
  });

  it("places hero media before details, controls before the quiet footer", () => {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("play").setStyle(ButtonStyle.Primary).setLabel("Play"));
    const card = embed("Song", undefined, "Playing").setImage("https://x/art.png", "Cover")
      .addFields({name: "Listening", value: "3:45"}).addActionRows(row)
      .setFooter({text: "Queue"}).setTimestamp(1000);
    const json = card.toJSON();
    const types = json.components.map(c => c.type);
    expect(types).toEqual([12, 10, 10, 14, 1, 14, 10, 14, 10]);
    expect(json.components.at(-1)).toEqual({ type: 10, content: "-# Queue · <t:1:R>" });
    expect(card.toJSON()).toEqual(json);
    privateReply(card, [row]);
    expect(card.toJSON()).toEqual(json);
  });

  it("falls back to text when media URLs are invalid", () => {
    for (const url of ["not a URL", "javascript:alert(1)", "file:///secret", "https://user:pass@x/y"]) {
      const card = embed("Song").setThumbnail(url).setImage(url).toJSON();
      expect(card.components.map(c => c.type)).toEqual([10]);
    }
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
