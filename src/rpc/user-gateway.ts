// Protocol reference: aiko-chan-ai/Discord-OAuth2-RPC, commit 07ea5a6 (MIT).
export const SDK_PROPERTIES = {
  browser: "Discord Embedded", browser_user_agent: "Discord Embedded/1.9.15780",
  browser_version: "1.9.15780", client_build_number: 15780,
  client_version: "1.9.15780", design_id: 0, device: "console",
  native_build_number: 15780, os: "Android", release_channel: "unknown",
};

/** One authorized user's connection. Fail closed; /rpc connect starts a fresh session. */
export class UserGateway {
  private socket?: WebSocket;
  private heartbeat?: NodeJS.Timeout;
  private deadline?: NodeJS.Timeout;
  private expiry?: NodeJS.Timeout;
  private rejectReady?: (error: Error) => void;
  private acknowledged = true;
  private sequence: number | null = null;
  private sessionId?: string;
  private activity: Record<string, unknown> | null = null;
  private pendingUpdate?: NodeJS.Timeout;

  constructor(private url = "wss://gateway.gaming-sdk.com/?v=9&encoding=json") {}

  get ready(): boolean { return !!this.sessionId; }

  connect(token: string, userId: string, expiresIn: number): Promise<void> {
    if (this.socket) return Promise.reject(new Error("RPC is already connecting"));
    const socket = this.socket = new WebSocket(this.url);
    return new Promise((resolve, reject) => {
      this.rejectReady = reject;
      this.deadline = setTimeout(() => this.close(), 20_000).unref();
      this.expiry = setTimeout(() => this.close(), Math.min(expiresIn * 1000, 2_147_483_647)).unref();
      socket.addEventListener("error", () => this.close());
      socket.addEventListener("close", () => this.close());
      socket.addEventListener("message", (event) => {
        try {
          if (typeof event.data !== "string" || event.data.length > 1_000_000) return this.close();
          const packet = JSON.parse(event.data);
          if (!packet || typeof packet.op !== "number") return this.close();
          if (Number.isSafeInteger(packet.s)) this.sequence = packet.s;
          switch (packet.op) {
            case 10: {
              const interval = packet.d?.heartbeat_interval;
              if (!Number.isFinite(interval) || interval < 1000 || interval > 120_000 || this.heartbeat) {
                return this.close();
              }
              this.send(2, {
                token, capabilities: 0,
                // Same SDK subscriptions as the reference; OAuth scopes constrain access.
                intents: 4096 | 262144 | 524288 | 4194304 | 8388608 | 134217728 | 268435456 | 536870912,
                properties: SDK_PROPERTIES,
              });
              const beat = () => {
                if (!this.acknowledged) return this.close();
                this.acknowledged = false;
                this.send(1, this.sequence);
                this.heartbeat = setTimeout(beat, interval).unref();
              };
              this.heartbeat = setTimeout(beat, Math.random() * interval).unref();
              break;
            }
            case 11: this.acknowledged = true; break;
            case 1: this.send(1, this.sequence); break;
            case 7: case 9: this.close(); break;
            case 0:
              if (packet.t !== "READY") break;
              if (!this.heartbeat || packet.d?.user?.id !== userId || !packet.d?.session_id ||
                  typeof packet.d.session_id !== "string") {
                return this.close();
              }
              this.sessionId = packet.d.session_id;
              clearTimeout(this.deadline);
              this.rejectReady = undefined;
              resolve();
          }
        } catch { this.close(); }
      });
    });
  }

  /** Coalesce rapid skips/pauses to stay below presence update limits. */
  setActivity(activity: Record<string, unknown> | null): void {
    this.activity = activity;
    if (!this.ready || this.pendingUpdate) return;
    this.pendingUpdate = setTimeout(() => {
      this.pendingUpdate = undefined;
      this.send(3, {
        activities: this.activity ? [{ ...this.activity, session_id: this.sessionId }] : [],
        afk: false, since: null, status: "online",
      });
    }, 4000).unref();
  }

  close(): void {
    clearTimeout(this.heartbeat);
    clearTimeout(this.deadline);
    clearTimeout(this.expiry);
    clearTimeout(this.pendingUpdate);
    this.pendingUpdate = undefined;
    this.activity = null;
    this.sessionId = undefined;
    this.rejectReady?.(new Error("RPC connection unavailable; authorize again."));
    this.rejectReady = undefined;
    const socket = this.socket;
    this.socket = undefined;
    try { if (socket && socket.readyState < WebSocket.CLOSING) socket.close(); } catch { /* Already closed. */ }
  }

  private send(op: number, d: unknown): void {
    try {
      if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ op, d }));
    } catch { this.close(); }
  }
}
