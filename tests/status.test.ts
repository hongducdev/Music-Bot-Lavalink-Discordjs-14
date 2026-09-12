import { describe, it, expect, vi, afterEach } from "vitest";
import { ActivityType, Collection, type Client } from "discord.js";
import { BOT_AUTHOR, buildStatuses, startStatusRotation } from "../src/status.js";

function fakeClient(ping = 123, guilds: [string, number][] = [["1", 10], ["2", 5]]) {
  const setActivity = vi.fn();
  const client = {
    ws: { ping },
    guilds: {
      cache: new Collection(guilds.map(([id, memberCount]) => [id, { memberCount }])),
    },
    user: { setActivity },
  } as unknown as Client;

  return { client, setActivity };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("buildStatuses", () => {
  it("reports ping, server count, member count, usage and author", () => {
    const { client } = fakeClient(123);
    const statuses = buildStatuses(client, "!");

    expect(statuses).toHaveLength(4);
    expect(statuses[0].name).toBe("🏓 Ping: 123ms");
    expect(statuses[1].name).toBe("🌐 2 server • 15 thành viên");
    expect(statuses[2].name).toBe("💬 !play + /play");
    expect(statuses[3].name).toContain(BOT_AUTHOR);
  });

  it("uses the prefix actually configured", () => {
    const { client } = fakeClient();

    expect(buildStatuses(client, "?")[2].name).toBe("💬 ?play + /play");
  });

  it("handles a bot that is in no servers", () => {
    const { client } = fakeClient(0, []);

    expect(buildStatuses(client, "!")[1].name).toBe("🌐 0 server • 0 thành viên");
  });

  it("listens on the usage status and watches the others", () => {
    const { client } = fakeClient();
    const types = buildStatuses(client, "!").map((status) => status.type);

    expect(types).toEqual([
      ActivityType.Watching,
      ActivityType.Watching,
      ActivityType.Listening,
      ActivityType.Watching,
    ]);
  });
});

describe("startStatusRotation", () => {
  it("sets a status right away and rotates on the interval", () => {
    vi.useFakeTimers();
    const { client, setActivity } = fakeClient(50);
    const timer = startStatusRotation(client, "!", 1000);

    expect(setActivity).toHaveBeenCalledTimes(1);
    expect(setActivity).toHaveBeenLastCalledWith("🏓 Ping: 50ms", { type: ActivityType.Watching });

    vi.advanceTimersByTime(1000);
    expect(setActivity).toHaveBeenLastCalledWith("🌐 2 server • 15 thành viên", {
      type: ActivityType.Watching,
    });

    clearInterval(timer);
  });

  it("reads a fresh ping value on every tick", () => {
    vi.useFakeTimers();
    const { client, setActivity } = fakeClient(50);
    const timer = startStatusRotation(client, "!", 1000);

    (client.ws as unknown as { ping: number }).ping = 77;
    // 4 nhip = di het mot vong status roi quay lai muc ping.
    vi.advanceTimersByTime(4000);

    expect(setActivity).toHaveBeenLastCalledWith("🏓 Ping: 77ms", { type: ActivityType.Watching });

    clearInterval(timer);
  });
});
