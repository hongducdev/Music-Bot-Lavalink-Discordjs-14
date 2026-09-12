import { describe, it, expect } from "vitest";
import { EMBED_COLORS, embed } from "../src/utils/embed.js";

describe("embed", () => {
  it("sets description and a default color", () => {
    const result = embed("hello").toJSON();

    expect(result.description).toBe("hello");
    expect(result.color).toBe(EMBED_COLORS.info);
  });

  it("accepts a custom color and title", () => {
    const result = embed("boom", EMBED_COLORS.error, "Loi").toJSON();

    expect(result.title).toBe("Loi");
    expect(result.color).toBe(EMBED_COLORS.error);
    expect(result.description).toBe("boom");
  });

  it("clips the description to Discord's 4096 character limit", () => {
    const result = embed("x".repeat(9000)).toJSON();

    expect(result.description!.length).toBeLessThanOrEqual(4096);
    expect(result.description!.endsWith("...")).toBe(true);
  });

  it("never sends an empty description", () => {
    expect(embed("").toJSON().description).toBe("-");
  });
});
