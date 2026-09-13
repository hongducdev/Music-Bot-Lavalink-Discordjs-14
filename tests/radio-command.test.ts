import { describe, it, expect, vi } from "vitest";
import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { command, playRadioStation, replyRadioResult } from "../src/commands/music/radio.js";
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

  it("plays radio station when user is in voice channel", async () => {    const track = { info: { title: "Lofi Live" } };
    const player = {
      connected: false,
      connect: vi.fn(async () => {}),
      search: vi.fn(async () => ({ tracks: [track] })),
      queue: {
        tracks: [],
        splice: vi.fn(async () => []),
      },
      setRepeatMode: vi.fn(async () => {}),
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
    expect(player.play).toHaveBeenCalledWith({ clientTrack: track, paused: false, position: 0 });
  });

  // Discord bo qua IsComponentsV2 o buoc defer: neu editReply thieu flag nay thi
  // Discord tu choi card (type 17) du dai da doi xong -> nguoi dung thay "loi".
  it("carries the Components V2 flag on the deferred reply", async () => {
    const interaction = {
      editReply: vi.fn(async () => ({})),
      deleteReply: vi.fn(async () => {}),
    } as unknown as ChatInputCommandInteraction;

    await replyRadioResult(interaction, { success: true, message: "ok" });

    const body = (interaction.editReply as any).mock.calls[0][0];
    expect(body.flags & MessageFlags.IsComponentsV2).toBe(MessageFlags.IsComponentsV2);
    expect(body.flags & MessageFlags.Ephemeral).toBe(MessageFlags.Ephemeral);
  });

  it("replies V2-safe after switching station from the slash command", async () => {
    const track = { info: { title: "Lofi Live" } };
    const player = {
      connected: true,
      search: vi.fn(async () => ({ tracks: [track] })),
      queue: { tracks: [], splice: vi.fn(async () => []) },
      setRepeatMode: vi.fn(async () => {}),
      playing: true,
      play: vi.fn(async () => {}),
    };
    const interaction = {
      guildId: "guild-1",
      channel: { id: "c1" },
      member: { user: { id: "u1" }, voice: { channel: { id: "v1", guild: { id: "guild-1" } } } },
      options: { getString: () => "lofi" },
      client: { lavalink: { getPlayer: () => player, createPlayer: () => player } },
      deferReply: vi.fn(async () => {}),
      editReply: vi.fn(async () => ({})),
    } as unknown as ChatInputCommandInteraction;

    await command.execute(interaction);

    const body = (interaction.editReply as any).mock.calls[0][0];
    expect(body.flags & MessageFlags.IsComponentsV2).toBe(MessageFlags.IsComponentsV2);
    expect(body.flags & MessageFlags.Ephemeral).toBe(MessageFlags.Ephemeral);
  });
});
