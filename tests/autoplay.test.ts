import { describe, it, expect } from "vitest";
import {
  buildRadioQuery,
  buildRelatedQuery,
  isAutoplayEnabled,
  pickRelatedTrack,
  playedIdentifiers,
  rememberPlayed,
  setAutoplay,
} from "../src/music/autoplay.js";

const track = (identifier: string) => ({ info: { identifier, title: identifier } });

describe("autoplay default", () => {
  it("is on for a guild that never touched the setting", () => {
    expect(isAutoplayEnabled("guild-chua-tung-bat-tat")).toBe(true);
  });

  it("disables only the guild that turned it off, and can be turned back on", () => {
    setAutoplay("guild-tat", false);

    expect(isAutoplayEnabled("guild-tat")).toBe(false);
    expect(isAutoplayEnabled("guild-khac")).toBe(true);

    setAutoplay("guild-tat", true);
    expect(isAutoplayEnabled("guild-tat")).toBe(true);
  });
});

describe("pickRelatedTrack", () => {
  it("never picks the one just played when something else is available", () => {
    expect(pickRelatedTrack([track("a"), track("b")], "a")?.info.identifier).toBe("b");
  });

  it("skips every track played recently", () => {
    const played = new Set(["a", "b"]);
    expect(pickRelatedTrack([track("a"), track("b"), track("c")], "b", played)?.info.identifier).toBe(
      "c"
    );
  });

  it("falls back to a non-immediate track when everything was played recently", () => {
    const played = new Set(["a", "b", "c"]);
    expect(pickRelatedTrack([track("a"), track("b")], "a", played)?.info.identifier).toBe("b");
  });

  it("returns null when the only result is the same track", () => {
    expect(pickRelatedTrack([track("a")], "a")).toBeNull();
  });

  it("returns null when there are no results", () => {
    expect(pickRelatedTrack([], "a")).toBeNull();
  });

  it("picks the first track when nothing was played before", () => {
    expect(pickRelatedTrack([track("a")], undefined)?.info.identifier).toBe("a");
  });

  it("varies the pick instead of always taking the same slot", () => {
    const tracks = [track("b"), track("c"), track("d")];
    const picks = new Set(
      Array.from({ length: 60 }, () => pickRelatedTrack(tracks, "a")?.info.identifier)
    );
    expect(picks.size).toBeGreaterThan(1);
  });
});

describe("played history", () => {
  it("remembers tracks per guild", () => {
    rememberPlayed("guild-1", "a");
    rememberPlayed("guild-1", "b");
    rememberPlayed("guild-2", "z");

    expect([...playedIdentifiers("guild-1")]).toEqual(["a", "b"]);
    expect([...playedIdentifiers("guild-2")]).toEqual(["z"]);
    expect([...playedIdentifiers("guild-moi")]).toEqual([]);
  });

  it("keeps only the newest entries", () => {
    for (let i = 0; i < 40; i++) rememberPlayed("guild-dai", `t${i}`);
    const played = playedIdentifiers("guild-dai");

    expect(played.size).toBe(30);
    expect(played.has("t0")).toBe(false);
    expect(played.has("t39")).toBe(true);
  });
});

describe("buildRadioQuery", () => {
  it("builds the YouTube mix link from a YouTube track", () => {
    expect(
      buildRadioQuery({ info: { identifier: "abc123", uri: "https://www.youtube.com/watch?v=abc123" } })
    ).toBe("https://www.youtube.com/watch?v=abc123&list=RDabc123");
  });

  it("returns null for a non-YouTube track", () => {
    expect(
      buildRadioQuery({ info: { identifier: "123", uri: "https://soundcloud.com/x/y" } })
    ).toBeNull();
  });

  it("returns null when there is no uri", () => {
    expect(buildRadioQuery({ info: { identifier: "abc123" } })).toBeNull();
  });
});

describe("buildRelatedQuery", () => {
  it("searches by channel name so results are not the same song again", () => {
    expect(buildRelatedQuery({ info: { title: "Faded", author: "Alan Walker" } })).toBe("Alan Walker");
  });

  it("falls back to the title when the author is missing", () => {
    expect(buildRelatedQuery({ info: { title: "Faded" } })).toBe("Faded");
  });
});
