import { describe, it, expect, vi } from "vitest";
import type { ChatInputCommandInteraction, Message } from "discord.js";
import { command } from "../src/commands/music/filter.js";

function stubPlayer() {
  return {
    filterManager: {
      filters: {
        nightcore: false,
        vaporwave: false,
        rotation: false,
        karaoke: false,
      },
      toggleNightcore: vi.fn(async () => {}),
      toggleVaporwave: vi.fn(async () => {}),
      toggleRotation: vi.fn(async () => {}),
      toggleKaraoke: vi.fn(async () => {}),
      setEQPreset: vi.fn(async () => {}),
      clearEQ: vi.fn(async () => {}),
      resetFilters: vi.fn(async () => {}),
    },
  };
}

describe("filter command", () => {
  it("toggles nightcore filter (slash)", async () => {
    const player = stubPlayer();
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      options: { getString: () => "nightcore" },
      reply: vi.fn(async () => {}),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(player.filterManager.toggleNightcore).toHaveBeenCalledOnce();
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("applies bassboost preset (slash)", async () => {
    const player = stubPlayer();
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      options: { getString: () => "bassboost" },
      reply: vi.fn(async () => {}),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(player.filterManager.setEQPreset).toHaveBeenCalledWith("BassboostMedium");
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("resets all filters on clear (slash)", async () => {
    const player = stubPlayer();
    const interaction = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      options: { getString: () => "clear" },
      reply: vi.fn(async () => {}),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(player.filterManager.resetFilters).toHaveBeenCalledOnce();
    expect(player.filterManager.clearEQ).toHaveBeenCalledOnce();
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("applies 8d filter via message command", async () => {
    const player = stubPlayer();
    const message = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => player } },
      reply: vi.fn(async () => {}),
    } as unknown as Message;

    await command.executeMessage!(message, ["8d"]);

    expect(player.filterManager.toggleRotation).toHaveBeenCalledOnce();
    expect(message.reply).toHaveBeenCalledOnce();
  });

  it("notifies when player does not exist", async () => {
    const message = {
      guildId: "guild-1",
      client: { lavalink: { getPlayer: () => null } },
      reply: vi.fn(async () => ({ delete: async () => {} })),
    } as unknown as Message;

    await command.executeMessage!(message, ["nightcore"]);

    expect(message.reply).toHaveBeenCalledOnce();
  });
});
