import { describe, it, expect, vi } from "vitest";
import type { ChatInputCommandInteraction, Message } from "discord.js";
import { command } from "../src/commands/music/volume.js";

function stubPlayer(currentVolume: number = 80) {
  let vol = currentVolume;
  return {
    volume: vol,
    setVolume: vi.fn(async (newVol: number) => {
      vol = newVol;
    }),
  };
}

describe("volume command", () => {
  it("displays current volume when no argument is provided (slash)", async () => {
    const player = stubPlayer(75);
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      options: { getInteger: () => null },
      reply: vi.fn(async () => {}),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(player.setVolume).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("sets volume to 50 when provided (slash)", async () => {
    const player = stubPlayer(80);
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      options: { getInteger: () => 50 },
      reply: vi.fn(async () => {}),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(player.setVolume).toHaveBeenCalledWith(50);
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("sets volume via message command", async () => {
    const player = stubPlayer(80);
    const message = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      reply: vi.fn(async () => {}),
    } as unknown as Message;

    await command.executeMessage!(message, ["65"]);

    expect(player.setVolume).toHaveBeenCalledWith(65);
    expect(message.reply).toHaveBeenCalledOnce();
  });

  it("warns if volume out of bounds (1 - 100) via message", async () => {
    const player = stubPlayer(80);
    const message = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      reply: vi.fn(async () => ({ delete: async () => {} })),
    } as unknown as Message;

    await command.executeMessage!(message, ["200"]);

    expect(player.setVolume).not.toHaveBeenCalled();
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
