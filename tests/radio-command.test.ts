import { describe, it, expect, vi } from "vitest";
import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { command, playRadioStation } from "../src/commands/music/radio.js";
import { RADIO_STATIONS, RADIO_SELECT_ID } from "../src/music/radio.js";

describe("radio command", () => {
  it("displays station list and select menu when no station is provided (slash)", async () => {
    const interaction = {
      guildId: "guild-1",
      options: { getString: () => null },
      reply: vi.fn(async () => {}),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledOnce();
    const callArgs = (interaction.reply as any).mock.calls[0][0];
    expect(callArgs.components).toBeDefined();
    expect(callArgs.components.length).toBe(1);
    expect(callArgs.flags & MessageFlags.IsComponentsV2).toBe(MessageFlags.IsComponentsV2);

    // Menu chon dai phai nam trong Container, khong render roi ben ngoai dai accent color.
    const json = (callArgs.components[0] as any).toJSON();
    expect(json.type).toBe(17);
    const row = (json.components as any[]).find((c) => c.type === 1);
    expect(row).toBeDefined();
    expect(row.components[0].type).toBe(3);
    expect(row.components[0].custom_id).toBe(RADIO_SELECT_ID);
  });

  it("warns if user is not in voice channel when requesting a station", async () => {
    const interaction = {
      guildId: "guild-1",
      member: { voice: { channel: null } },
      options: { getString: () => "lofi" },
      reply: vi.fn(async () => ({ id: "m1" })),
      deleteReply: vi.fn(async () => {}),
      replied: false,
      deferred: false,
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("plays radio station when user is in voice channel", async () => {
    const track = { info: { title: "Lofi Live" } };
    const player = {
      connected: false,
      connect: vi.fn(async () => {}),
      search: vi.fn(async () => ({ tracks: [track] })),
      queue: {
        tracks: [],
        add: vi.fn(),
      },
      playing: false,
      play: vi.fn(async () => {}),
    };

    const member = {
      user: { id: "u1" },
      voice: { channel: { id: "v1", name: "Voice Channel", guild: { id: "guild-1" } } },
    };

    const textChannel = {
      id: "c1",
      permissionsFor: () => ({ has: () => true }),
    };

    const client = {
      lavalink: {
        getPlayer: () => null,
        createPlayer: () => player,
      },
    };

    const result = await playRadioStation(
      member as any,
      textChannel as any,
      RADIO_STATIONS.lofi,
      client as any
    );

    expect(result.success).toBe(true);
    expect(player.connect).toHaveBeenCalledOnce();
    expect(player.search).toHaveBeenCalledWith(
      expect.objectContaining({ query: RADIO_STATIONS.lofi.query }),
      member.user
    );
    expect(player.play).toHaveBeenCalledOnce();
  });
});
