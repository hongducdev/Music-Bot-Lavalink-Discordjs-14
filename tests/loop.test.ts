import { describe, it, expect, vi } from "vitest";
import type { ChatInputCommandInteraction, Message } from "discord.js";
import { command } from "../src/commands/music/loop.js";

function stubPlayer(initialMode: "off" | "track" | "queue" = "off") {
  let mode = initialMode;
  return {
    repeatMode: mode,
    setRepeatMode: vi.fn(async (newMode: "off" | "track" | "queue") => {
      mode = newMode;
      return true;
    }),
  };
}

describe("loop command", () => {
  it("cycles from off -> track when no mode argument is given (slash)", async () => {
    const player = stubPlayer("off");
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      options: { getString: () => null },
      reply: vi.fn(async () => {}),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(player.setRepeatMode).toHaveBeenCalledWith("track");
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("cycles from track -> queue (slash)", async () => {
    const player = stubPlayer("track");
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      options: { getString: () => null },
      reply: vi.fn(async () => {}),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(player.setRepeatMode).toHaveBeenCalledWith("queue");
  });

  it("cycles from queue -> off (slash)", async () => {
    const player = stubPlayer("queue");
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      options: { getString: () => null },
      reply: vi.fn(async () => {}),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(player.setRepeatMode).toHaveBeenCalledWith("off");
  });

  it("sets specific mode when provided in slash command", async () => {
    const player = stubPlayer("off");
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      options: { getString: (name: string) => (name === "mode" ? "queue" : null) },
      reply: vi.fn(async () => {}),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(player.setRepeatMode).toHaveBeenCalledWith("queue");
  });

  it("cycles when called via message command without args", async () => {
    const player = stubPlayer("off");
    const message = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      reply: vi.fn(async () => {}),
    } as unknown as Message;

    await command.executeMessage!(message, []);

    expect(player.setRepeatMode).toHaveBeenCalledWith("track");
    expect(message.reply).toHaveBeenCalledOnce();
  });

  it("parses text mode arguments like 'all' -> 'queue' in message command", async () => {
    const player = stubPlayer("off");
    const message = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      reply: vi.fn(async () => {}),
    } as unknown as Message;

    await command.executeMessage!(message, ["all"]);

    expect(player.setRepeatMode).toHaveBeenCalledWith("queue");
  });

  it("notifies when no player is active", async () => {
    const message = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => null } },
      reply: vi.fn(async () => ({ delete: async () => {} })),
    } as unknown as Message;

    await command.executeMessage!(message, []);

    expect(message.reply).toHaveBeenCalledOnce();
  });
});
