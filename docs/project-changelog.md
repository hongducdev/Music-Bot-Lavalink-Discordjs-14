# Project Changelog

## Unreleased — 2026-09-13

### Added

- `/weather <diadiem>`, prefix/mention equivalents and `thoitiet` alias: Vietnamese Components V2 current conditions, apparent temperature, humidity, wind, today's range/UV/rain probability, six future forecast hours and seven days. Open-Meteo + GeoNames, inspired by Overmorrow's provider choice; no copied code/assets or dependencies.
- Owner-bound location selection for ambiguous names, destination-local times, missing-data placeholders and bounded requests with safe provider errors. Slash replies ephemeral; prefix replies silent/public. Requires command registration and bot restart.

### Changed

- Rebuilt shared Components V2 layout: native JSON only, blurple/red accents, separate content groups, compact separators, controls before muted footer. Removed synthetic embed metadata and unused bot-author icon state.
- Unified track-start and nowplaying cards with Media Gallery artwork, listening details, next-track preview and one primary playback button.
- Queue now presents the current track first, followed by ten bounded titles. Redesigned help categories, radio groups, bot introduction and Vietnamese command feedback.

### Fixed

- Low-impact ping display: `/ping` and prefix ping now measure the awaited HTTP reply with a monotonic clock, replacing local-time minus Discord-time subtraction that could report negative latency. Rename WebSocket metric to Gateway heartbeat; unavailable samples display no fabricated value. Keep uptime and response visibility; edit the original reply instead of posting another message.
- Medium-impact payload rejection risk: bound combined card text and recursive component count; cap media alt text and ignore malformed/non-web media URLs.
- Escape track-title brackets and Markdown; validate link schemes before rendering provider metadata.
- Low-impact queue display: live-stream durations no longer inflate total time with Java's unlimited-duration sentinel.

### Verification

- Weather: build and 197 tests / 25 files pass, including six weather regression checks. Live search → location lookup → forecast → V2 serialization succeeded for Hanoi (168 hourly rows, seven daily rows). Live Discord acceptance and deployment not performed.

- Ping regression: 6 dedicated tests cover both handlers, clock skew/rollback, unavailable heartbeat and failed sends. Full suite: 191 tests / 24 files; build passes.
- Build passes; 185 tests pass across 23 files. Tests inspect actual V2 JSON, all loaded help commands, long metadata, artwork fallback, live queues and existing command behavior.
- Local preview includes seven card types. Browser policy blocked opening local files; no live Discord visual/API acceptance or restart performed.
- Cards remain snapshots at send time; use `/nowplaying` to refresh state. No new dependencies.

## Unreleased — 2026-09-12

### Added

- Optional requester RPC: `/rpc connect`, `/rpc status`, `/rpc disconnect`, plus prefix equivalents.
- Requester-bound OAuth PKCE with expiring single-use state and in-memory Gaming SDK connections.
- Song title, artist, timing and song link; pause/resume and stop/queue lifecycle synchronization.
- Local security/state tests and real loopback WebSocket protocol checks.
- Bot info embed (on a direct ping) adds a "Mời bot" link button carrying exactly the permissions the bot needs.

### Fixed

- Autoplay/fallback now pass the track requester to Lavalink search, preserving attribution for RPC.
- Bot info now appears **only on a real ping**. Replying to a bot message no longer triggers it: Discord puts the author of the message being replied to into `message.mentions.users` even when the message text contains no ping, so the gate now also requires `message.mentions.parsedUsers` (ping tokens actually present in the content). See `shouldShowBotInfo` in `src/bot-info.ts`.
- Bot info card was being sent without its content: the reply payload spread `silentReply(card)` and then overwrote the `components` key with the invite button, dropping the whole container. Now passes the button through `silentReply(card, [button])`.

### Changed

- README condensed to setup, commands and features; deep playback troubleshooting moved to `docs/troubleshooting.md`, and the stale `application.example.yml` copy step is gone.

### Limitations

- Needs application Social SDK/Public Client and a registered callback. Live Discord acceptance not yet performed.
- Restart, access-token expiry or lost Gateway requires relinking; no persistent tokens or automatic refresh.
