import { describe, it, expect, vi } from "vitest";
import type { ButtonInteraction, GuildMember } from "discord.js";
import {
  buildMusicController,
  handleMusicController,
  MUSIC_CONTROLLER_IDS,
} from "../src/music/controller.js";

describe("buildMusicController", () => {
  it("creates an action row with 5 buttons", () => {
    const row = buildMusicController();
    expect(row.components).toHaveLength(5);

    const ids = row.components.map((btn) => "custom_id" in btn.data ? btn.data.custom_id : undefined);
    expect(ids).toEqual([
      MUSIC_CONTROLLER_IDS.playPause,
      MUSIC_CONTROLLER_IDS.skip,
      MUSIC_CONTROLLER_IDS.shuffle,
      MUSIC_CONTROLLER_IDS.loop,
      MUSIC_CONTROLLER_IDS.stop,
    ]);
  });

  it("adjusts play/pause label when paused vs playing", () => {
    const playingRow = buildMusicController({ paused: false } as any);
    const pausedRow = buildMusicController({ paused: true } as any);

    const playingBtn = playingRow.components[0].data as { label?: string };
    const pausedBtn = pausedRow.components[0].data as { label?: string };

    expect(playingBtn.label).toBe("Tạm dừng");
    expect(pausedBtn.label).toBe("Tiếp tục");
  });
});

describe("handleMusicController", () => {
  function makeInteraction(
    customId: string,
    player: any,
    memberVoiceId: string | null = "voice-1"
  ) {
    return {
      customId,
      guildId: "guild-1",
      member: {
        voice: { channelId: memberVoiceId },
      } as unknown as GuildMember,
      client: {
        lavalink: {
          getPlayer: () => player,
        },
      },
      reply: vi.fn(async () => ({ id: "reply-1" })),
      deleteReply: vi.fn(async () => {}),
      replied: false,
      deferred: false,
    } as unknown as ButtonInteraction;
  }

  it("ignores non-music button interactions", async () => {
    const interaction = makeInteraction("unrelated_button", null);
    const handled = await handleMusicController(interaction);
    expect(handled).toBe(false);
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it("rejects when player does not exist", async () => {
    const interaction = makeInteraction(MUSIC_CONTROLLER_IDS.playPause, null);
    const handled = await handleMusicController(interaction);
    expect(handled).toBe(true);
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("rejects when user is not in a voice channel", async () => {
    const player = { voiceChannelId: "voice-1" };
    const interaction = makeInteraction(MUSIC_CONTROLLER_IDS.playPause, player, null);
    const handled = await handleMusicController(interaction);
    expect(handled).toBe(true);
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("rejects when user is in a different voice channel than the bot", async () => {
    const player = { voiceChannelId: "voice-1" };
    const interaction = makeInteraction(MUSIC_CONTROLLER_IDS.playPause, player, "voice-different");
    const handled = await handleMusicController(interaction);
    expect(handled).toBe(true);
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("toggles pause/resume on playPause button", async () => {
    const player = {
      voiceChannelId: "voice-1",
      paused: false,
      pause: vi.fn(async () => {}),
      resume: vi.fn(async () => {}),
    };

    const interaction1 = makeInteraction(MUSIC_CONTROLLER_IDS.playPause, player);
    await handleMusicController(interaction1);
    expect(player.pause).toHaveBeenCalledOnce();

    player.paused = true;
    const interaction2 = makeInteraction(MUSIC_CONTROLLER_IDS.playPause, player);
    await handleMusicController(interaction2);
    expect(player.resume).toHaveBeenCalledOnce();
  });

  it("skips track on skip button", async () => {
    const player = {
      voiceChannelId: "voice-1",
      queue: { current: { info: { title: "Test Song" } } },
      skip: vi.fn(async () => {}),
    };

    const interaction = makeInteraction(MUSIC_CONTROLLER_IDS.skip, player);
    await handleMusicController(interaction);

    expect(player.skip).toHaveBeenCalledWith(0, false);
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("shuffles queue on shuffle button", async () => {
    const player = {
      voiceChannelId: "voice-1",
      queue: {
        tracks: [{ info: { title: "1" } }, { info: { title: "2" } }],
        shuffle: vi.fn(async () => 2),
      },
    };

    const interaction = makeInteraction(MUSIC_CONTROLLER_IDS.shuffle, player);
    await handleMusicController(interaction);

    expect(player.queue.shuffle).toHaveBeenCalledOnce();
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("cycles repeat mode on loop button", async () => {
    const player = {
      voiceChannelId: "voice-1",
      repeatMode: "off",
      setRepeatMode: vi.fn(async () => {}),
    };

    const interaction = makeInteraction(MUSIC_CONTROLLER_IDS.loop, player);
    await handleMusicController(interaction);

    expect(player.setRepeatMode).toHaveBeenCalledWith("track");
    expect(interaction.reply).toHaveBeenCalledOnce();
  });

  it("destroys player on stop button", async () => {
    const player = {
      voiceChannelId: "voice-1",
      destroy: vi.fn(async () => {}),
    };

    const interaction = makeInteraction(MUSIC_CONTROLLER_IDS.stop, player);
    await handleMusicController(interaction);

    expect(player.destroy).toHaveBeenCalledOnce();
    expect(interaction.reply).toHaveBeenCalledOnce();
  });
});
