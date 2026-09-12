import { once } from "node:events";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { UserGateway } from "../src/rpc/user-gateway.js";

// Use Lavalink's installed WebSocket server dependency; exercise real loopback sockets.
const require = createRequire(import.meta.url);
const { WebSocketServer } = createRequire(require.resolve("lavalink-client"))("ws") as typeof import("ws");

async function peer() {
  const server = new WebSocketServer({ host: "127.0.0.1", port: 0 });
  await once(server, "listening");
  const address = server.address();
  if (typeof address === "string" || !address) throw new Error("Missing server address");
  const gateway = new UserGateway(`ws://127.0.0.1:${address.port}`);
  const connection = once(server, "connection");
  const ready = gateway.connect("Bearer test-only", "alice", 60);
  // Attach rejection handling immediately; individual tests assert the result below.
  void ready.catch(() => {});
  const [socket] = await connection;
  const packets: { op: number; d: any }[] = [];
  socket.on("message", (raw: Buffer) => {
    const packet = JSON.parse(raw.toString());
    packets.push(packet);
    if (packet.op === 1) socket.send(JSON.stringify({ op: 11, d: null }));
  });
  const send = (op: number, d: unknown, t?: string) => socket.send(JSON.stringify({ op, d, t, s: 1 }));
  const cleanup = async () => {
    gateway.close();
    for (const client of server.clients) client.terminate();
    await new Promise<void>(resolve => server.close(() => resolve()));
  };
  return { gateway, ready, packets, socket, send, cleanup };
}

describe("User Gateway over a real WebSocket", () => {
  it("identifies, heartbeats, coalesces latest activity and clears it", async () => {
    const p = await peer();
    try {
      p.send(10, { heartbeat_interval: 1000 });
      await expect.poll(() => p.packets.find(packet => packet.op === 2)).toMatchObject({
        d: { token: "Bearer test-only", capabilities: 0 },
      });
      p.send(0, { user: { id: "alice" }, session_id: "session" }, "READY");
      await p.ready;
      p.gateway.setActivity({ details: "old" });
      p.gateway.setActivity({ details: "latest" });
      await expect.poll(() => p.packets.filter(packet => packet.op === 3), { timeout: 6000 }).toEqual([
        { op: 3, d: { activities: [{ details: "latest", session_id: "session" }], afk: false, since: null, status: "online" } },
      ]);
      expect(p.packets.some(packet => packet.op === 1)).toBe(true);
      p.gateway.setActivity(null);
      await expect.poll(() => p.packets.filter(packet => packet.op === 3).at(-1)?.d.activities,
        { timeout: 6000 }).toEqual([]);
      p.gateway.close();
      expect(p.gateway.ready).toBe(false);
    } finally { await p.cleanup(); }
  }, 15_000);

  it("rejects READY for another account and malformed HELLO without leaking tokens", async () => {
    for (const wrongUser of [true, false]) {
      const p = await peer();
      try {
        if (wrongUser) {
          p.send(10, { heartbeat_interval: 1000 });
          await expect.poll(() => p.packets.some(packet => packet.op === 2)).toBe(true);
          p.send(0, { user: { id: "bob" }, session_id: "session" }, "READY");
        } else p.send(10, { heartbeat_interval: -1 });
        await expect(p.ready).rejects.toThrow("RPC connection unavailable");
        expect(p.gateway.ready).toBe(false);
      } finally { await p.cleanup(); }
    }
  });
});
