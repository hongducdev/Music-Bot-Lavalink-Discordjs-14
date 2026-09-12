# Phase 01 — OAuth and user Gateway

## Context Links

- [Plan](plan.md)
- [Reference PoC](https://github.com/aiko-chan-ai/Discord-OAuth2-RPC)
- `src/config.ts`, `src/index.ts`

## Overview

- Priority: high
- Status: complete (local implementation)
- Add the smallest secure-enough in-memory OAuth PKCE flow and Discord Gaming SDK Gateway transport.

## Key Insights

- The requester must authorize; a bot token cannot alter another user's profile.
- OAuth state must bind the callback to the requester and be consumed once.
- Discord expects heartbeat plus Gateway opcodes 2, 3, 10, and 11.

## Requirements

- RPC remains disabled when `RPC_REDIRECT_URI` is absent.
- Generate PKCE verifier/challenge and expiring state with `node:crypto`.
- Validate `/users/@me` matches the requester stored in state.
- Keep access tokens and sockets only in memory.
- Isolate connection errors so music playback keeps working.

## Architecture

`/rpc connect` → authorization URL → callback → token exchange → verify user → user Gateway → presence updates.

## Related Code Files

- Modify: `src/index.ts`, `.env.example`
- Create: `src/rpc/requester-rpc.ts`, `src/rpc/user-gateway.ts`, `src/rpc/oauth-state.ts`
- RPC configuration is isolated from mandatory bot config for command-loader compatibility.

## Implementation Steps

1. Add optional RPC configuration derived from the exact redirect URI.
2. Implement minimal Gateway connect, heartbeat, presence send, and close.
3. Implement PKCE state, callback server, token exchange, identity check, and session map.
4. Start the callback server with the bot and close sockets on shutdown.

## Todo List

- [x] Add optional RPC config.
- [x] Add user Gateway transport.
- [x] Add OAuth/session manager.
- [x] Wire lifecycle in `src/index.ts`.

## Success Criteria

- Build passes with RPC configured and unconfigured.
- Invalid, expired, reused, or mismatched state cannot create a session.
- Failed RPC connection does not interrupt the bot.

## Risk Assessment

- Discord Social SDK access may reject users outside the tester list until approved.
- In-memory tokens disappear on restart by design.

## Security Considerations

- PKCE S256, single-use random state, short expiry, exact user-ID validation.
- Never log or persist OAuth tokens.

## Next Steps

- Integrate commands and music lifecycle in phase 02.
