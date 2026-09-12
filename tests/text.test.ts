import { describe, it, expect } from "vitest";
import { clip, shortReason } from "../src/utils/text.js";

const JAVA_STACK =
  "(yts.version: 1.18.2) All clients failed to load the item.\r\n\r\n" +
  "Client [TVHTML5] failed: The page needs to be reloaded.\r\n" +
  "\tat dev.lavalink.youtube.clients.skeleton.Client.getPlayabilityStatus(Client.java:77)\r\n".repeat(40);

describe("shortReason", () => {
  it("keeps only the first line of a multi-line stack trace", () => {
    const reason = shortReason(JAVA_STACK);

    expect(reason).toBe("(yts.version: 1.18.2) All clients failed to load the item.");
    expect(reason).not.toContain("\n");
    expect(reason.length).toBeLessThan(2000);
  });

  it("handles a missing message", () => {
    expect(shortReason(undefined)).toBe("unknown");
    expect(shortReason("")).toBe("unknown");
  });
});

describe("clip", () => {
  it("truncates content to Discord's 2000 character limit", () => {
    const result = clip("x".repeat(5000));

    expect(result.length).toBeLessThanOrEqual(2000);
    expect(result.endsWith("...")).toBe(true);
  });

  it("leaves short content untouched", () => {
    expect(clip("hello")).toBe("hello");
  });
});
