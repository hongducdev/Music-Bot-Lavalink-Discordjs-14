import { describe, it, expect, vi } from "vitest";
import type { ChatInputCommandInteraction, Message } from "discord.js";
import { command, parseTimeToMs } from "../src/commands/music/seek.js";

describe("parseTimeToMs", () => {
  it("parses raw seconds as numbers", () => {
    expect(parseTimeToMs("90")).toBe(90_000);
    expect(parseTimeToMs("0")).toBe(0);
  });

  it("parses mm:ss format", () => {
    expect(parseTimeToMs("1:30")).toBe(90_000);
    expect(parseTimeToMs("01:30")).toBe(90_000);
    expect(parseTimeToMs("10:00")).toBe(600_000);
  });

  it("parses hh:mm:ss format", () => {
    expect(parseTimeToMs("1:02:05")).toBe(3_725_000);
    expect(parseTimeToMs("01:00:00")).toBe(3_600_000);
  });

  it("parses human duration units like 2m, 30s, 1h30m", () => {
    expect(parseTimeToMs("30s")).toBe(30_000);
    expect(parseTimeToMs("2m")).toBe(120_000);
    expect(parseTimeToMs("1h30m")).toBe(5_400_000);
  });

  it("returns null for invalid inputs", () => {
    expect(parseTimeToMs("abc")).toBeNull();
    expect(parseTimeToMs("-50")).toBeNull();
    expect(parseTimeToMs("")).toBeNull();
  });
});

describe("seek command", () => {
  function stubPlayer(durationMs: number = 300_000, isStream: boolean = false) {
    return {
      queue: {
        current: {
          info: {
            title: "Test Track",
            duration: durationMs,
            isStream,
          },
        },
      },
      seek: vi.fn(async (_ms: number) => {}),
    };
  }

  it("seeks successfully with valid time (slash)", async () => {
    const player = stubPlayer(300_000);
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      options: { getString: () => "1:30" },
      reply: vi.fn(async () => {}),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(player.seek).toHaveBeenCalledWith(90_000);
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("rejects seeking beyond track duration", async () => {
    const player = stubPlayer(100_000);
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      options: { getString: () => "5:00" },
      reply: vi.fn(async () => ({ delete: async () => {} })),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(player.seek).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("rejects seeking live streams", async () => {
    const player = stubPlayer(0, true);
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      options: { getString: () => "1:00" },
      reply: vi.fn(async () => ({ delete: async () => {} })),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(player.seek).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("seeks via message command", async () => {
    const player = stubPlayer(300_000);
    const message = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      reply: vi.fn(async () => {}),
    } as unknown as Message;

    await command.executeMessage!(message, ["90"]);

    expect(player.seek).toHaveBeenCalledWith(90_000);
    expect(message.reply).toHaveBeenCalledOnce();
  });
});
