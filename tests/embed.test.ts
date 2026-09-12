import { describe, it, expect, vi, afterEach } from "vitest";
import { MessageFlags, type Message, type RepliableInteraction } from "discord.js";
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
} from "../src/utils/embed.js";

describe("embed", () => {
  it("sets description and the default pastel color", () => {
    const result = embed("hello").toJSON();

    expect(result.description).toBe("hello");
    expect(result.color).toBe(EMBED_COLORS.default);
    expect(result.color).toBe(0xecc5c0);
  });

  it("accepts a custom color and author name", () => {
    const result = embed("boom", EMBED_COLORS.error, "Loi").toJSON();

    expect(result.author?.name).toBe("Loi");
    expect(result.color).toBe(EMBED_COLORS.error);
    expect(result.color).toBe(0xff4949);
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

  it("clips the description to Discord's 4096 character limit", () => {
    const result = embed("x".repeat(9000)).toJSON();

    expect(result.description!.length).toBeLessThanOrEqual(4096);
    expect(result.description!.endsWith("...")).toBe(true);
  });

  it("never sends an empty description", () => {
    expect(embed("").toJSON().description).toBe("-");
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

    expect(reply).toHaveBeenCalledWith(expect.objectContaining({ flags: MessageFlags.Ephemeral }));
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
      expect.objectContaining({ flags: MessageFlags.SuppressNotifications })
    );
    expect(sent.delete).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(DELETE_AFTER.error);
    expect(sent.delete).toHaveBeenCalledTimes(1);
  });
});

describe("reply visibility", () => {
  it("keeps private replies ephemeral and ping-free", () => {
    const payload = privateReply(embed("hi"));

    expect(payload.flags & MessageFlags.Ephemeral).toBe(MessageFlags.Ephemeral);
    expect(payload.allowedMentions).toEqual({ parse: [] });
  });

  it("keeps public replies silent and ping-free", () => {
    const payload = silentReply(embed("hi"));

    expect(payload.flags & MessageFlags.SuppressNotifications).toBe(
      MessageFlags.SuppressNotifications
    );
    expect(payload.flags & MessageFlags.Ephemeral).toBe(0);
    expect(payload.allowedMentions).toBe(NO_PING);
  });

  it("does not let a requester mention notify anyone", () => {
    const parsed = (silentReply(embed("<@42>")).allowedMentions.parse ?? []).length;

    expect(parsed).toBe(0);
  });
});
