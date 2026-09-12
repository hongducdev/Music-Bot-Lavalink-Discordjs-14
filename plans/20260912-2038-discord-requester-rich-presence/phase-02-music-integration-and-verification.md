# Phase 02 — Music integration and verification

## Context Links

- [Plan](plan.md)
- [Phase 01](phase-01-oauth-and-user-gateway.md)
- `src/music/player.ts`, `src/commands/music/play.ts`

## Overview

- Priority: high
- Status: implemented; live Discord acceptance pending
- Expose connect/status/disconnect and mirror requester playback into RPC.

## Key Insights

- `track.requester.id` already identifies who should receive the activity.
- The shared Lavalink event handlers are the smallest correct integration point.

## Requirements

- `/rpc connect|status|disconnect` and equivalent prefix command.
- Rich Presence shows title, author, track URL button, and accurate timing when playing.
- Pause removes running timestamps; resume recalculates them.
- New requester clears the prior requester's activity; stop/queue end clears current activity.
- Unlinked requesters do not affect playback.

## Architecture

Lavalink events → requester RPC manager → matching in-memory user Gateway.

## Related Code Files

- Modify: `src/music/player.ts`, `src/index.ts`, `README.md`
- Create: `src/commands/utility/rpc.ts`, `src/rpc/music-presence.ts`, `tests/requester-rpc.test.ts`, `tests/user-gateway.test.ts`

## Implementation Steps

1. Add connect/status/disconnect command responses.
2. Reuse shared player events for start, pause, resume, queue end, and stop cleanup.
3. Add one focused test for OAuth/activity pure logic and edge cases.
4. Run `npx tsc --noEmit` and `npm test`.
5. Review security and simplify only if the live diff crosses configured thresholds.
6. Document setup, limitations, and Social SDK prerequisites.

## Todo List

- [x] Add RPC command.
- [x] Wire music lifecycle updates.
- [x] Add focused tests.
- [x] Compile and run full test suite.
- [x] Review implementation (main agent; no subagent tools available).
- [x] Update README and plan status.
- [ ] Verify OAuth and visible profile activity against a configured Discord application.

## Success Criteria

- Authorized requesters see their current song on profile.
- Disconnect, stop, queue end, and requester change remove stale activity.
- Existing music behavior and tests remain unchanged.

## Risk Assessment

- Discord's private/experimental Gaming SDK Gateway may change independently of discord.js.
- A user playing in multiple guilds gets last-started playback; this PoC does not merge activities.

## Security Considerations

- Authorization links are requester-bound and one-use.
- Responses never expose tokens; callback errors are generic.

## Next Steps

- Persistent encrypted refresh tokens only if the PoC proves useful.
