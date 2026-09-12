import { createServer, type Server } from "node:http";
import { OAuthState, RPC_SCOPES } from "./oauth-state.js";
import { SDK_PROPERTIES, UserGateway } from "./user-gateway.js";

export interface RpcOptions { clientId: string; redirectUri: string; host: string; port: number }

export function readRpcOptions(clientId: string, env = process.env): RpcOptions | undefined {
  if (!env.RPC_REDIRECT_URI) return;
  const url = new URL(env.RPC_REDIRECT_URI);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const port = Number(env.RPC_PORT || (local ? url.port || (url.protocol === "https:" ? "443" : "80") : "8787"));
  if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
      url.username || url.password || url.search || url.hash || url.pathname !== "/callback" ||
      !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("RPC requires HTTPS (HTTP allowed on loopback), /callback, and a valid RPC_PORT");
  }
  return { clientId, redirectUri: url.toString(), host: env.RPC_HOST || (url.hostname === "[::1]" ? "::1" : "127.0.0.1"), port };
}

export class RequesterRpc {
  // ponytail: single-process memory only; use encrypted storage + refresh for durable sessions.
  private state = new OAuthState();
  private sessions = new Map<string, UserGateway>();
  private server?: Server;
  private running = false;
  onConnected: (userId: string) => void = () => {};

  constructor(private options: RpcOptions) {}

  async start(): Promise<void> {
    const server = this.server = createServer((req, res) => {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader("X-Content-Type-Options", "nosniff");
      let url: URL;
      try { url = new URL(req.url || "/", "http://localhost"); }
      catch { res.writeHead(400).end("Invalid URL"); return; }
      if (req.method !== "GET" || url.pathname !== "/callback") {
        res.writeHead(404).end("Not found");
        return;
      }
      void this.callback(url).then(() => res.end("Đã liên kết RPC. Bạn có thể đóng trang này."))
        .catch(() => res.writeHead(400).end("Liên kết không thành công hoặc đã hết hạn. Chạy /rpc connect để thử lại."));
    });
    server.requestTimeout = 10_000;
    server.headersTimeout = 10_000;
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(this.options.port, this.options.host, () => {
        server.removeListener("error", reject);
        this.running = true;
        resolve();
      });
    });
    server.on("error", () => { this.close(); console.error("[rpc] Callback server unavailable."); });
  }

  connectLink(userId: string): string {
    if (!this.running) throw new Error("RPC unavailable");
    // Closed sessions contain no token/socket and can be discarded before admitting another user.
    for (const [id, gateway] of this.sessions) if (!gateway.ready) this.sessions.delete(id);
    if (this.sessions.size >= 1000 && !this.sessions.has(userId)) throw new Error("RPC capacity reached");
    return this.state.begin(userId, this.options.clientId, this.options.redirectUri);
  }

  connected(userId: string): boolean { return this.sessions.get(userId)?.ready ?? false; }
  setActivity(userId: string, activity: Record<string, unknown> | null): void {
    this.sessions.get(userId)?.setActivity(activity);
  }
  disconnect(userId: string): void {
    this.state.cancel(userId);
    this.sessions.get(userId)?.close();
    this.sessions.delete(userId);
  }
  close(): void {
    this.running = false;
    this.state.clear();
    for (const session of this.sessions.values()) session.close();
    this.sessions.clear();
    this.server?.close();
    this.server?.closeAllConnections();
  }

  private async callback(url: URL): Promise<void> {
    const params = url.searchParams;
    const state = params.get("state") || "";
    if (params.getAll("state").length !== 1) throw new Error("Invalid callback");
    const ticket = this.state.take(state);
    let gateway: UserGateway | undefined;
    try {
      const code = params.get("code");
      if (params.has("error") || !code || code.length > 4096 || params.getAll("code").length !== 1) {
        throw new Error("Authorization denied");
      }
      const token = await sdkRequest("/oauth2/token", {
        method: "POST", body: new URLSearchParams({
          client_id: this.options.clientId, grant_type: "authorization_code", code,
          code_verifier: ticket.verifier, redirect_uri: this.options.redirectUri,
        }),
      });
      const scopes = typeof token.scope === "string" ? token.scope.split(" ") : [];
      if (typeof token.access_token !== "string" || !token.access_token ||
          typeof token.token_type !== "string" || token.token_type.toLowerCase() !== "bearer" ||
          typeof token.expires_in !== "number" || !Number.isFinite(token.expires_in) || token.expires_in <= 0 ||
          !RPC_SCOPES.split(" ").every(scope => scopes.includes(scope))) {
        throw new Error("Invalid token response");
      }
      const authorization = `Bearer ${token.access_token}`;
      const user = await sdkRequest("/users/@me", { headers: { Authorization: authorization } });
      if (user.id !== ticket.userId || !this.state.current(state) || !this.running) {
        throw new Error("Requester mismatch or canceled authorization");
      }
      gateway = new UserGateway();
      await gateway.connect(authorization, ticket.userId, token.expires_in);
      if (!this.state.current(state) || !this.running || !gateway.ready ||
          (this.sessions.size >= 1000 && !this.sessions.has(ticket.userId))) {
        throw new Error("Authorization canceled or capacity reached");
      }
      this.sessions.get(ticket.userId)?.close();
      this.sessions.set(ticket.userId, gateway);
      this.onConnected(ticket.userId);
    } catch (error) {
      gateway?.close();
      throw error;
    } finally { this.state.finish(state); }
  }
}

async function sdkRequest(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const headers = new Headers(init.headers);
  headers.set("User-Agent", SDK_PROPERTIES.browser_user_agent);
  headers.set("X-Super-Properties", Buffer.from(JSON.stringify(SDK_PROPERTIES)).toString("base64"));
  const response = await fetch(`https://gaming-sdk.com/api${path}`, {
    ...init, headers, redirect: "error", signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("Discord OAuth request failed");
  const body = await response.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid response");
  return body as Record<string, unknown>;
}

declare module "discord.js" { interface Client { requesterRpc?: RequesterRpc } }
