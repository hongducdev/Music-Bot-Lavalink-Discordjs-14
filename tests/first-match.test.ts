import { describe, it, expect } from "vitest";
import { firstMatch } from "../src/music/fallback.js";

describe("firstMatch", () => {
  it("returns the match from the first source that has results", async () => {
    const result = await firstMatch(["a", "b"], async (source) => [
      `${source}-track`,
    ]);

    expect(result).toEqual({ source: "a", match: "a-track" });
  });

  it("skips sources that return nothing", async () => {
    const result = await firstMatch(["a", "b", "c"], async (source) =>
      source === "c" ? ["c-track"] : []
    );

    expect(result).toEqual({ source: "c", match: "c-track" });
  });

  it("keeps going when a source throws", async () => {
    const result = await firstMatch(["a", "b"], async (source) => {
      if (source === "a") throw new Error("source down");
      return ["b-track"];
    });

    expect(result).toEqual({ source: "b", match: "b-track" });
  });

  it("returns null when every source fails", async () => {
    const result = await firstMatch(["a", "b"], async () => []);

    expect(result).toBeNull();
  });

  it("returns null for an empty source list", async () => {
    expect(await firstMatch([], async () => ["x"])).toBeNull();
  });
});
