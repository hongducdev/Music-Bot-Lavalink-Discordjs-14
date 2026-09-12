import { describe, it, expect, vi } from "vitest";
import type { ChatInputCommandInteraction, Message } from "discord.js";
import { command } from "../src/commands/music/skip.js";

const CURRENT = { info: { title: "Con Cá Con Chim", uri: "https://youtu.be/x" } };

function stubPlayer(skip: (skipTo?: number, throwError?: boolean) => Promise<unknown>) {
  return { queue: { current: CURRENT, tracks: [] }, skip };
}

describe("skip", () => {
  it("allows skipping the last track without throwing (prefix)", async () => {
    // lavalink-client: skip(0, true) nem RangeError khi hang doi rong.
    const skip = vi.fn(async (_skipTo?: number, throwError?: boolean) => {
      if (throwError) throw new RangeError("Can't skip more than the queue size");
    });
    const message = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => stubPlayer(skip) } },
      reply: vi.fn(async () => {}),
    } as unknown as Message;

    await command.executeMessage!(message, []);

    expect(skip).toHaveBeenCalledWith(0, false);
    expect(message.reply).toHaveBeenCalledOnce();
  });

  it("allows skipping the last track without throwing (slash)", async () => {
    const skip = vi.fn(async (_skipTo?: number, throwError?: boolean) => {
      if (throwError) throw new RangeError("Can't skip more than the queue size");
    });
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => stubPlayer(skip) } },
      reply: vi.fn(async () => {}),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(skip).toHaveBeenCalledWith(0, false);
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("stays quiet when nothing is playing", async () => {
    const skip = vi.fn(async () => {});
    const message = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => ({ queue: { current: null, tracks: [] }, skip }) } },
      reply: vi.fn(async () => ({ delete: async () => {} })),
    } as unknown as Message;

    await command.executeMessage!(message, []);

    expect(skip).not.toHaveBeenCalled();
  });
});
