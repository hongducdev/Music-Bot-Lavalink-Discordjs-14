# Components V2 rebuild — 2026-09-13

- Cause of old-looking UI: V2 flag wrapped an embed-shaped renderer; all fields were packed into one text block. Track-start and `/nowplaying` duplicated layout.
- Rebuilt serialization and grouped sections; extracted one music card used by both paths. Kept small caller methods to avoid rewriting playback business logic.
- Removed synthetic JSON properties. Existing presentation tests now inspect actual serialized payloads rather than hidden embed metadata.
- Regression checks found Markdown link escaping was opt-in in discord.js; explicitly escaped brackets so titles cannot close their surrounding link.
- Build and 185 tests pass. Added combined text/component budgets, malformed artwork fallback and live queue duration checks.
- Preview generation via tsx hit an OS user-info error; used compiled modules instead. Browser URL policy blocks local-file preview, so visual acceptance remains unverified. No network messages sent.
- Known limits: cards are send-time snapshots; long descriptions are clipped; gallery aspect ratio and image availability depend on provider and Discord client.
