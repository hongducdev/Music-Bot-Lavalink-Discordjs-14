import { createHash, randomBytes } from "node:crypto";

export const RPC_SCOPES = "openid sdk.social_layer_presence";
type Ticket = { userId: string; verifier: string; expires: number; used: boolean };

/** Requester-bound, single-use PKCE tickets. Kept until completion so disconnect cancels callbacks. */
export class OAuthState {
  private tickets = new Map<string, Ticket>();

  begin(userId: string, clientId: string, redirectUri: string): string {
    this.cancel(userId);
    for (const [key, ticket] of this.tickets) {
      if (ticket.expires <= Date.now()) this.tickets.delete(key);
    }
    if (this.tickets.size >= 1000) throw new Error("Too many pending authorizations");
    const state = randomBytes(32).toString("base64url");
    const verifier = randomBytes(32).toString("base64url");
    this.tickets.set(state, { userId, verifier, expires: Date.now() + 300_000, used: false });
    const url = new URL("https://discord.com/oauth2/authorize");
    url.search = new URLSearchParams({
      client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: RPC_SCOPES,
      state, code_challenge: createHash("sha256").update(verifier).digest("base64url"),
      code_challenge_method: "S256",
    }).toString();
    return url.toString();
  }

  take(state: string): Ticket {
    const ticket = this.tickets.get(state);
    if (!ticket || ticket.used || ticket.expires <= Date.now()) throw new Error("Invalid state");
    ticket.used = true;
    return ticket;
  }

  current(state: string): boolean {
    return (this.tickets.get(state)?.expires ?? 0) > Date.now();
  }

  finish(state: string): void { this.tickets.delete(state); }
  clear(): void { this.tickets.clear(); }
  cancel(userId: string): void {
    for (const [key, ticket] of this.tickets) {
      if (ticket.userId === userId) this.tickets.delete(key);
    }
  }
}
