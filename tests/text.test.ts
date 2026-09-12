import { describe, it, expect } from "vitest";
import {
  clip,
  formatDuration,
  formatTrackDuration,
  playerStatus,
  requesterName,
  shortReason,
  trackLink,
} from "../src/utils/text.js";

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

describe("formatDuration", () => {
  it("formats under an hour as m:ss", () => {
    expect(formatDuration(59_000)).toBe("0:59");
    expect(formatDuration(3_600_000 - 1)).toBe("59:59");
  });

  it("formats an hour or more as h:mm:ss", () => {
    expect(formatDuration(3_600_000)).toBe("1:00:00");
    expect(formatDuration(3_725_000)).toBe("1:02:05");
  });

  it("marks live streams instead of showing a length", () => {
    expect(formatTrackDuration(0)).toBe("Trực tiếp");
    expect(formatTrackDuration(undefined)).toBe("Trực tiếp");
    expect(formatTrackDuration(null)).toBe("Trực tiếp");
    expect(formatTrackDuration(59_000)).toBe("0:59");
  });

  it("shows 0:00 for a position at the very start of a track", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(undefined)).toBe("0:00");
    expect(formatDuration(-5)).toBe("0:00");
  });
});

describe("trackLink", () => {
  it("links the title when a uri is present", () => {
    expect(trackLink({ title: "Song", uri: "https://x/y" })).toBe("[Song](https://x/y)");
  });

  it("falls back to a bare title without a uri", () => {
    expect(trackLink({ title: "Song" })).toBe("Song");
    expect(trackLink({ title: "Song", uri: null })).toBe("Song");
  });
});

describe("requesterName", () => {
  it("mentions the requester when an id is available", () => {
    expect(requesterName({ id: "42", username: "duc" })).toBe("<@42>");
  });

  it("falls back to username, then to a placeholder", () => {
    expect(requesterName({ username: "duc" })).toBe("duc");
    expect(requesterName(undefined)).toBe("Không rõ");
  });
});

describe("playerStatus", () => {
  it("renders volume, paused state and autoplay", () => {
    expect(playerStatus({ volume: 80, paused: false, autoplay: true })).toBe(
      "Âm lượng: `80%` | Tạm dừng: `Không` | Autoplay: `Bật`"
    );
    expect(playerStatus({ volume: 100, paused: true, autoplay: false })).toContain("Tạm dừng: `Có`");
  });
});
