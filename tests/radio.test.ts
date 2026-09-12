import { describe, it, expect } from "vitest";
import {
  RADIO_STATIONS,
  RADIO_HEALTHY_MS,
  RADIO_MAX_RETRIES,
  clearActiveRadio,
  decideRadioEnd,
  findRadioStation,
  getActiveRadio,
  markRadioStarted,
  setActiveRadio,
  tagRadioTrack,
  buildRadioEmbed,
  buildRadioSelectMenu,
  RADIO_SELECT_ID,
} from "../src/music/radio.js";

describe("radio module", () => {
  it("contains pre-configured 24/7 stations", () => {
    expect(RADIO_STATIONS.lofi).toBeDefined();
    expect(RADIO_STATIONS.chill).toBeDefined();
    expect(RADIO_STATIONS.sleep).toBeDefined();
    expect(RADIO_STATIONS.vov3).toBeDefined();
    expect(RADIO_STATIONS.vov1).toBeDefined();
    expect(RADIO_STATIONS.hanoi).toBeDefined();
    expect(RADIO_STATIONS.danang).toBeDefined();
    expect(RADIO_STATIONS.quangninh).toBeDefined();
  });

  it("never ships a station without a real stream url", () => {
    // Lop bao ve loi tung ton tai: link chet (host khong ton tai) tung duoc ship.
    for (const station of Object.values(RADIO_STATIONS)) {
      expect(station.query, station.id).toMatch(/^https?:\/\//);
      expect(station.name.length, station.id).toBeGreaterThan(3);
      expect(station.description.length, station.id).toBeGreaterThan(3);
    }
  });

  it("keeps every station id unique and inside Discord's 25 option limit", () => {
    const ids = Object.values(RADIO_STATIONS).map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeLessThanOrEqual(25);
  });

  it("finds station by exact key", () => {
    const station = findRadioStation("lofi");
    expect(station?.id).toBe("lofi");
  });

  it("finds station case-insensitively or with spaces", () => {
    const station = findRadioStation("  CHILL ");
    expect(station?.id).toBe("chill");
  });

  it("returns undefined for unknown station", () => {
    expect(findRadioStation("unknown_station")).toBeUndefined();
    expect(findRadioStation("")).toBeUndefined();
  });

  it("builds a descriptive embed with all stations", () => {
    const embed = buildRadioEmbed();
    const json = embed.toJSON();

    expect(json.author?.name).toContain("Đài phát thanh 24/7");
    expect(json.description).toContain("Lofi Girl");
    expect(json.description).toContain("VOV3");
  });

  it("builds a StringSelectMenu with matching options", () => {
    const row = buildRadioSelectMenu();
    expect(row.components).toHaveLength(1);

    const menu = row.components[0].toJSON() as any;
    expect(menu.custom_id).toBe(RADIO_SELECT_ID);
    expect(menu.options.length).toBe(Object.keys(RADIO_STATIONS).length);
  });
});


describe("radio self-healing", () => {
  it("retries while the station keeps dropping early", () => {
    setActiveRadio("g-retry", RADIO_STATIONS.vov3);
    markRadioStarted("g-retry");

    expect(decideRadioEnd("g-retry")).toEqual({ retry: true, attempts: 1 });
    expect(decideRadioEnd("g-retry")).toEqual({ retry: true, attempts: 2 });
    expect(decideRadioEnd("g-retry")).toEqual({ retry: true, attempts: 3 });
  });

  it("gives up after RADIO_MAX_RETRIES early drops so it cannot loop forever", () => {
    setActiveRadio("g-stop", RADIO_STATIONS.vov3);
    markRadioStarted("g-stop");

    for (let i = 0; i < RADIO_MAX_RETRIES; i++) decideRadioEnd("g-stop");
    expect(decideRadioEnd("g-stop").retry).toBe(false);
  });

  it("treats a long healthy run as a fresh start", () => {
    setActiveRadio("g-ok", RADIO_STATIONS.vov3);
    markRadioStarted("g-ok");
    decideRadioEnd("g-ok", Date.now()); // 1 lan dut som

    const later = Date.now() + RADIO_HEALTHY_MS + 1;
    expect(decideRadioEnd("g-ok", later)).toEqual({ retry: true, attempts: 0 });
  });

  it("clearing the station forgets the retry counter", () => {
    setActiveRadio("g-clear", RADIO_STATIONS.vov3);
    markRadioStarted("g-clear");
    decideRadioEnd("g-clear");

    clearActiveRadio("g-clear");
    expect(getActiveRadio("g-clear")).toBeUndefined();
    expect(decideRadioEnd("g-clear", Date.now())).toEqual({ retry: true, attempts: 1 });
  });

  it("tags the stream with the station name for the now-playing card", () => {
    const track = { info: { title: "Unknown title", author: "Unknown artist" } };
    tagRadioTrack(track, RADIO_STATIONS.vov3);
    expect(track.info.title).toBe(RADIO_STATIONS.vov3.name);
    expect(track.info.author).toBe("Radio 24/7");
  });
});
