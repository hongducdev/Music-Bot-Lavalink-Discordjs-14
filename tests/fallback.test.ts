import { describe, it, expect } from "vitest";
import {
  buildFallbackQuery,
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
