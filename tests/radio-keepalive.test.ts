import { afterEach, expect, it, vi } from "vitest";
import { LavalinkManager, Player, type Track } from "lavalink-client";
import {
  RADIO_HEALTHY_MS,
  RADIO_STATIONS,
  clearActiveRadio,
  decideRadioEnd,
  setActiveRadio,
} from "../src/music/radio.js";

// player.ts doc .env (config) luc import; dat san gia tri de test chay duoc ca
// khi may khong co .env.
process.env.DISCORD_TOKEN ??= "test-token";
process.env.CLIENT_ID ??= "123456789";
const { createLavalink, queueRelatedTrack } = await import("../src/music/player.js");

const ytLive = {
  encoded: "radio",
  info: {
    identifier: "rFZHOHl-L8A",
    sourceName: "youtube",
    title: "Lofi Girl - beats to relax/study",
    author: "Lofi Girl",
    uri: "https://www.youtube.com/watch?v=rFZHOHl-L8A",
    isStream: true,
    duration: 0,
  },
} as unknown as Track;

afterEach(() => {
  clearActiveRadio("guild-radio");
  vi.restoreAllMocks();
});

function setup() {
  const lavalink = createLavalink({
    guilds: { cache: new Map() },
    channels: { cache: new Map() },
  } as never);
  const player = new Player(
    { guildId: "guild-radio", voiceChannelId: "voice", node: "main-node" },
    lavalink
  );
  return { lavalink, player };
}

it("counts a YouTube live station as healthy, not as a failing stream", async () => {
  const { lavalink, player } = setup();
  setActiveRadio("guild-radio", RADIO_STATIONS.lofi);

  lavalink.emit("trackStart", player, ytLive);

  // Song qua nguong healthy thi lan dut ke tiep phai duoc coi la lan chay moi,
  // khong phai loi -> khong bo dai sau 3 lan dut.
  expect(decideRadioEnd("guild-radio", Date.now() + RADIO_HEALTHY_MS + 1)).toEqual({
    retry: true,
    attempts: 0,
  });
});

it("does not let autoplay replace a running station with a related song", async () => {
  const { player } = setup();
  setActiveRadio("guild-radio", RADIO_STATIONS.lofi);
  const search = vi.spyOn(player, "search");

  await queueRelatedTrack(player, ytLive);

  expect(search).not.toHaveBeenCalled();
});

it("still autoplays a normal song when no station is running", async () => {
  const { player } = setup();
  const search = vi.spyOn(player, "search").mockResolvedValue({ tracks: [] } as never);

  await queueRelatedTrack(player, ytLive);

  expect(search).toHaveBeenCalled();
});
