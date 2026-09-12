import { describe, it, expect, vi } from "vitest";
import type { ChatInputCommandInteraction, Message } from "discord.js";
import { command } from "../src/commands/music/shuffle.js";

function stubPlayer(tracksCount: number = 3) {
  const tracks = Array.from({ length: tracksCount }, (_, i) => ({
    info: { title: `Song ${i + 1}` },
  }));
  return {
    queue: {
      tracks,
      shuffle: vi.fn(async () => tracks.length),
    },
  };
}

describe("shuffle command", () => {
  it("shuffles the queue when there are 2 or more tracks (slash)", async () => {
    const player = stubPlayer(5);
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      reply: vi.fn(async () => {}),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(player.queue.shuffle).toHaveBeenCalledOnce();
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("warns if queue has fewer than 2 tracks (slash)", async () => {
    const player = stubPlayer(1);
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      reply: vi.fn(async () => ({ delete: async () => {} })),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(player.queue.shuffle).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("shuffles queue via prefix message command", async () => {
    const player = stubPlayer(3);
    const message = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      reply: vi.fn(async () => {}),
    } as unknown as Message;

    await command.executeMessage!(message, []);

    expect(player.queue.shuffle).toHaveBeenCalledOnce();
    expect(message.reply).toHaveBeenCalledOnce();
  });

  it("notifies when player does not exist", async () => {
    const message = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => null } },
      reply: vi.fn(async () => ({ delete: async () => {} })),
    } as unknown as Message;

    await command.executeMessage!(message, []);

    expect(message.reply).toHaveBeenCalledOnce();
  });
});
