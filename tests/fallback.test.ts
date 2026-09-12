import { describe, it, expect } from "vitest";
import {
  buildFallbackQuery,
  isDirectStream,
  markAsFallback,
  shouldFallback,
} from "../src/music/fallback.js";

describe("buildFallbackQuery", () => {
  it("combines title and author", () => {
    expect(
      buildFallbackQuery({ info: { title: "Faded", author: "Alan Walker" } })
    ).toBe("Faded Alan Walker");
  });

  it("works when the author is missing", () => {
    expect(buildFallbackQuery({ info: { title: "Faded" } })).toBe("Faded");
  });
});

describe("shouldFallback", () => {
  it("allows the first fallback attempt", () => {
    expect(
      shouldFallback({ info: { title: "x" }, userData: { requester: { id: "1" } } })
    ).toBe(true);
  });

  it("blocks a second attempt for an already replaced track", () => {
    expect(
      shouldFallback({ info: { title: "x" }, userData: { fallback: true } })
    ).toBe(false);
  });

  it("handles a missing track", () => {
    expect(shouldFallback(null)).toBe(false);
    expect(shouldFallback(undefined)).toBe(false);
  });

  it("never falls back for a direct-url stream (radio/HLS)", () => {
    // Loi tung ton tai: dai radio loi -> search SoundCloud theo ten dai
    // ("VOH FM 99.9 MHz Radio 24/7") -> phat mot bai hat ngau nhien.
    expect(
      shouldFallback({
        info: { title: "VOH FM 99.9 MHz", author: "Radio 24/7", sourceName: "http" },
      })
    ).toBe(false);
  });

  it("still falls back for a normal youtube track", () => {
    expect(
      shouldFallback({ info: { title: "Faded", author: "Alan Walker", sourceName: "youtube" } })
    ).toBe(true);
  });
});

describe("isDirectStream", () => {
  it("detects http and local sources", () => {
    expect(isDirectStream({ info: { sourceName: "http" } })).toBe(true);
    expect(isDirectStream({ info: { sourceName: "local" } })).toBe(true);
  });

  it("is false for searchable platforms and missing tracks", () => {
    expect(isDirectStream({ info: { sourceName: "youtube" } })).toBe(false);
    expect(isDirectStream({ info: { sourceName: "soundcloud" } })).toBe(false);
    expect(isDirectStream(null)).toBe(false);
    expect(isDirectStream(undefined)).toBe(false);
  });
});

describe("markAsFallback", () => {
  it("keeps the existing userData and adds the flag", () => {
    const requester = { id: "1" };
    expect(markAsFallback({ requester })).toEqual({ requester, fallback: true });
  });

  it("works when userData is not an object", () => {
    expect(markAsFallback(undefined)).toEqual({ fallback: true });
  });
});
