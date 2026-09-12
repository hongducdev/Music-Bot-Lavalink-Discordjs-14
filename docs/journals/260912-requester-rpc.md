---
date: 2026-09-12
status: implemented-awaiting-live-verification
---

# Requester RPC

## Context

User approved an in-memory OAuth RPC PoC based on Discord-OAuth2-RPC.

## What happened

Implemented requester-bound PKCE, optional callback server, one Gateway per user, RPC command and shared music event hooks. Corrected autoplay/fallback requester propagation. Build/typecheck and 99 local tests passed.

## Reflection

The reference uses Social SDK presence scopes, not legacy RPC scopes. Local tests verify transport behavior, but cannot prove Discord accepts the application or renders the activity.

## Decisions

Use Node HTTP/fetch/WebSocket and no new npm dependencies. Keep tokens in RAM; disconnect/restart/expiry requires relinking. Coalesce updates over four seconds. Last-started guild owns the user's activity. Skill-requested journal saved here; subagents unavailable, so main agent performed review/testing.

## Next

Set callback and application permissions, deploy commands, then verify live OAuth and profile rendering. No commit or deployment performed.
