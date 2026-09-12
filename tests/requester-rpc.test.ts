import { createHash } from "node:crypto";
import type { Client } from "discord.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OAuthState, RPC_SCOPES } from "../src/rpc/oauth-state.js";
import type { RequesterRpc } from "../src/rpc/requester-rpc.js";
import { readRpcOptions } from "../src/rpc/requester-rpc.js";
import { MusicPresence, songActivity, voiceAudience } from "../src/rpc/music-presence.js";

afterEach(() => vi.useRealTimers());

describe("RPC authorization", () => {
  it("binds PKCE and one-use state to the requester", () => {
    const flow = new OAuthState();
    const url = new URL(flow.begin("alice", "app", "https://music.example/callback"));
    const state = url.searchParams.get("state")!;
    const ticket = flow.take(state);
    expect(ticket.userId).toBe("alice");
    expect(url.searchParams.get("scope")).toBe(RPC_SCOPES);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBe(
      createHash("sha256").update(ticket.verifier).digest("base64url")
    );
    expect(() => flow.take(state)).toThrow();
    expect(() => flow.take("forged")).toThrow();
    flow.cancel("alice");
    expect(flow.current(state)).toBe(false);
  });

  it("rejects expired links and cancels an in-flight callback on reconnect/disconnect", () => {
    vi.useFakeTimers();
    const flow = new OAuthState();
    const begin = (id: string) => new URL(flow.begin(id, "app", "https://music.example/callback")).searchParams.get("state")!;
    const first = begin("alice");
    flow.take(first);
    const second = begin("alice");
    expect(flow.current(first)).toBe(false);
    const bob = begin("bob");
    flow.cancel("alice");
    expect(() => flow.take(second)).toThrow();
    expect(flow.current(bob)).toBe(true);
    vi.advanceTimersByTime(300_001);
    expect(() => flow.take(bob)).toThrow();
    flow.clear();
    expect(flow.current(bob)).toBe(false);
  });

  it("disables RPC by default and validates the callback boundary", () => {
    expect(readRpcOptions("app", {})).toBeUndefined();
    expect(readRpcOptions("app", { RPC_REDIRECT_URI: "https://music.example/callback" })).toEqual({
      clientId: "app", redirectUri: "https://music.example/callback", host: "127.0.0.1", port: 8787,
    });
    expect(readRpcOptions("app", { RPC_REDIRECT_URI: "http://127.0.0.1:9000/callback" })?.port).toBe(9000);
    expect(readRpcOptions("app", { RPC_REDIRECT_URI: "http://127.0.0.1/callback" })?.port).toBe(80);
    expect(readRpcOptions("app", { RPC_REDIRECT_URI: "http://[::1]:9000/callback" })?.host).toBe("::1");
    for (const uri of ["http://music.example/callback", "https://user:pass@music.example/callback",
      "https://music.example/other", "https://music.example/callback?code=x", "https://music.example/callback#x"]) {
      expect(() => readRpcOptions("app", { RPC_REDIRECT_URI: uri })).toThrow();
    }
    expect(() => readRpcOptions("app", { RPC_REDIRECT_URI: "https://music.example/callback", RPC_PORT: "-1" })).toThrow();
  });
});

describe("Requester song activity", () => {
  const info = { title: "Faded", author: "Alan Walker", duration: 180_000, uri: "https://youtu.be/example" };

  it("shows actual song metadata, clamps timing and never adds a running timer while paused/live", () => {
    const playing = songActivity(info, 30_000, false, "app", "BongoCat", 1_000_000);
    expect(playing).toMatchObject({ name: "BongoCat", type: 2, details: "Faded", state: "Alan Walker", application_id: "app",
      timestamps: { start: 970_000, end: 1_150_000 }, metadata: { button_urls: [info.uri] } });
    const paused = songActivity(info, 30_000, true, "app", "BongoCat");
    expect(paused.timestamps).toBeUndefined();
    expect(paused.state).toContain("Tạm dừng");
    expect(songActivity({ ...info, isStream: true }, 0, false, "app", "BongoCat").timestamps).toBeUndefined();
    expect(songActivity(info, Infinity, false, "app", "BongoCat", 1_000_000).timestamps).toEqual({ start: 1_000_000, end: 1_180_000 });
    expect(songActivity(info, 200_000, false, "app", "BongoCat", 1_000_000).timestamps).toEqual({ start: 820_000, end: 1_000_000 });
    expect(songActivity({ ...info, uri: "javascript:alert(1)" }, 0, false, "app", "BongoCat").buttons).toBeUndefined();
  });

  it("plays the guild's song to voice listeners and the requester, and drops whoever leaves", () => {
    let inVoice: string[] = ["bob", "carol"];
    const presence = new MusicPresence(() => inVoice);
    const player = { guildId: "one", voiceChannelId: "v1", position: 0, paused: false };
    const first = { info, requester: { id: "alice" } };
    const third = { info: { ...info, title: "Third" }, requester: { id: "erin" } };

    expect(presence.start(player, first)).toEqual(["bob", "carol", "alice"]);
    expect(presence.activity("carol", "app", "BongoCat")?.details).toBe("Faded");
    expect(presence.activity("dave", "app", "BongoCat")).toBeNull();

    inVoice = ["bob"];
    expect(presence.sync(player)).toEqual(["bob", "carol", "alice"]);
    expect(presence.activity("carol", "app", "BongoCat")).toBeNull();
    player.paused = true;
    expect(presence.activity("bob", "app", "BongoCat")?.timestamps).toBeUndefined();
    player.paused = false;

    inVoice = ["dave"];
    expect(presence.start(player, third)).toEqual(["bob", "alice", "dave", "erin"]);
    expect(presence.activity("bob", "app", "BongoCat")).toBeNull();
    expect(presence.clear("one", first)).toEqual([]);
    expect(presence.activity("dave", "app", "BongoCat")?.details).toBe("Third");

    // Liên kết RPC sau khi bài đã phát vẫn nhận bài hiện tại của guild mình đang ngồi.
    expect(presence.join("frank", "one")).toEqual(["frank"]);
    expect(presence.activity("frank", "app", "BongoCat")?.details).toBe("Third");
    expect(presence.join("frank", "two")).toEqual(["frank"]);
    expect(presence.activity("frank", "app", "BongoCat")).toBeNull();

    // Guild khác phát bài mới thì chiếm quyền hiển thị; xoá guild cũ không động vào nó.
    const other = { guildId: "two", voiceChannelId: "v2", position: 0, paused: false };
    presence.start(other, { info: { ...info, title: "Only two" }, requester: { id: "gina" } });
    expect(presence.clear("one")).toEqual(["erin"]);
    expect(presence.activity("dave", "app", "BongoCat")?.details).toBe("Only two");
    expect(presence.activity("erin", "app", "BongoCat")).toBeNull();
    expect(presence.clear("two")).toEqual(["dave", "gina"]);
    expect(presence.activity("dave", "app", "BongoCat")).toBeNull();
    expect(presence.start(player, null)).toEqual([]);
  });
});

describe("RPC voice audience", () => {
  const states = (entries: Array<[string, string | null, boolean?]>) =>
    new Map(entries.map(([id, channelId, bot]) => [id, { id, channelId, member: bot === undefined ? null : { user: { bot } } }]));
  const audienceOf = (entries: Array<[string, string | null, boolean?]>, connected: string[]) =>
    voiceAudience(
      { guilds: { cache: new Map([["one", { voiceStates: { cache: states(entries) } }]]) } } as unknown as Client,
      { connected: (id: string) => connected.includes(id) } as unknown as RequesterRpc
    )({ guildId: "one", voiceChannelId: "v1", position: 0, paused: false });

  it("reads voice states even when the member cache is empty, and skips bots/outsiders", () => {
    expect(audienceOf([["u1", "v1"], ["u2", "v2"], ["u3", null]], ["u1", "u2", "u3"])).toEqual(["u1"]);
    expect(audienceOf([["u1", "v1"], ["bot", "v1", true]], ["u1", "bot"])).toEqual(["u1"]);
    expect(audienceOf([["u1", "v1"]], [])).toEqual([]);
    expect(voiceAudience(
      { guilds: { cache: new Map() } } as unknown as Client,
      { connected: () => true } as unknown as RequesterRpc
    )({ guildId: "one", voiceChannelId: null, position: 0, paused: false })).toEqual([]);
  });
});
