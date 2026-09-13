# YouTube-inspired music cards and consistent V2 UI

- [x] Trace shared renderer, track-start/nowplaying, play/queue, controllers and utility cards.
- [x] Diagnose: media follows metadata, controls buried below fields; per-command emoji conventions diverge.
- [x] Centralize heading/control icons and normalize field labels; preserve provider content.
- [x] Put artwork first, title/artist/timeline together and controls before secondary content.
- [x] Apply music accent to playback/queue/added-track cards; show repeat mode in button label/icon.
- [x] Build, check actual payloads and regressions, regenerate preview.
- [x] Review and document.

Native Discord controls determine dimensions/fonts/colors; this uses YouTube's information order and music accent, not an embedded YouTube player. Timeline is a bounded snapshot, no seek affordance or periodic network updates.

No delegate tools available; code tracing, implementation, testing and review performed directly. Live Discord rendering/restart remains unverified.
