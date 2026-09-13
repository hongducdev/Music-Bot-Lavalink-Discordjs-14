import { afterEach, expect, it, vi } from "vitest";
import { LavalinkManager, Player, type Track } from "lavalink-client";
import { playRadioStation } from "../src/commands/music/radio.js";
import { clearActiveRadio, getActiveRadio, RADIO_STATIONS } from "../src/music/radio.js";

afterEach(() => { clearActiveRadio("123"); vi.restoreAllMocks(); });

function setup(playing = true, paused = false) {
  const manager = new LavalinkManager({
    nodes: [{ id: "test", host: "localhost", port: 2333, authorization: "test-only" }],
    sendToShard: () => {}, client: { id: "123" },
  });
  const player = new Player({ guildId: "123", voiceChannelId: "456", node: "test" }, manager);
  player.connected = true;
  player.playing = playing;
  player.paused = paused;
  player.repeatMode = "queue";
  const old = { encoded: "old-track", info: { title: "Old song", duration: 180_000 } } as Track;
  const station = { encoded: "radio-track", info: { title: "Live", isStream: true } } as Track;
  player.queue.current = old;
  player.queue.tracks.push(old);
  vi.spyOn(player, "search").mockResolvedValue({ tracks: [station] } as any);
  // Only the transport is stubbed: real installed Player.play/Queue methods build the request.
  const update = vi.spyOn(player.node, "updatePlayer").mockResolvedValue({} as any);
  const member = { user: { id: "789" }, voice: { channel: { id: "456", guild: { id: "123" } } } };
  const run = () => playRadioStation(member as any, { id: "987" }, RADIO_STATIONS.vov3, { lavalink: { getPlayer: () => player } });
  return { player, old, station, update, run };
}

it.each([[true, false], [false, true], [false, false]])(
  "replaces the current track without a stop/end-event roundtrip (playing=%s, paused=%s)", async (playing, paused) => {
    const { player, station, update, run } = setup(playing, paused);
    expect((await run()).success).toBe(true);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0]).toMatchObject({
      noReplace: false, playerOptions: { track: { encoded: "radio-track" }, paused: false, position: 0 },
    });
    expect(player.queue.current).toBe(station);
    expect(player.queue.tracks).toHaveLength(0);
    expect(player.repeatMode).toBe("off");
    expect(getActiveRadio("123")).toBe(RADIO_STATIONS.vov3);
  },
);

it("preserves playback when the station cannot be resolved", async () => {
  const { player, old, update, run } = setup();
  vi.mocked(player.search).mockResolvedValue({ tracks: [] } as any);
  expect((await run()).success).toBe(false);
  expect(update).not.toHaveBeenCalled();
  expect(player.queue.current).toBe(old);
  expect(player.queue.tracks).toEqual([old]);
  expect(player.repeatMode).toBe("queue");
});

it("restores the local queue and repeat mode when replacement is rejected", async () => {
  const { player, old, update, run } = setup();
  update.mockRejectedValue(new Error("request failed"));
  expect((await run()).success).toBe(false);
  expect(player.queue.current).toBe(old);
  expect(player.queue.tracks).toEqual([old]);
  expect(player.repeatMode).toBe("queue");
  expect(getActiveRadio("123")).toBeUndefined();
});
