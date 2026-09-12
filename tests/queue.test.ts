import { describe, it, expect, beforeEach } from "vitest";
import { MusicQueue } from "../src/music/queue.js";

describe("MusicQueue", () => {
  let queue: MusicQueue<string>;

  beforeEach(() => {
    queue = new MusicQueue<string>();
  });

  it("adds tracks and tracks length", () => {
    queue.add("track-1");
    queue.add("track-2");

    expect(queue.size()).toBe(2);
    expect(queue.getAll()).toEqual(["track-1", "track-2"]);
  });

  it("pops the next track in order", () => {
    queue.add("track-1");
    queue.add("track-2");

    const first = queue.next();
    expect(first).toBe("track-1");
    expect(queue.size()).toBe(1);
    expect(queue.current).toBe("track-1");
  });

  it("clears the queue", () => {
    queue.add("track-1");
    queue.add("track-2");
    queue.clear();

    expect(queue.size()).toBe(0);
    expect(queue.current).toBeUndefined();
  });
});
