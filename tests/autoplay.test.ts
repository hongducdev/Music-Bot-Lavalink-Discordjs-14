import { describe, it, expect } from "vitest";
import {
  isAutoplayEnabled,
  pickRelatedTrack,
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
  it("picks the first track that is not the one just played", () => {
    const result = pickRelatedTrack([track("a"), track("b")], "a");

    expect(result?.info.identifier).toBe("b");
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
});
