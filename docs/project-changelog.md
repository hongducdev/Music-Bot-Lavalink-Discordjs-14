# Project Changelog

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
