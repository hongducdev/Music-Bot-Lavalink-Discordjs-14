# Development Roadmap

## Music → radio transition — 2026-09-13

- [x] Trace skip/play behavior in installed lavalink-client and shared radio callers.
- [x] Replace active/paused music directly with the selected radio stream; preserve local state on rejection.
- [x] Verify real Player/Queue request construction for playing/paused/idle states and failure paths.
- [x] Chay that voi Lavalink that: nhac dang phat → `/radio` vov3 → track doi ngay, `playing=true`, bot song qua 10s. Nghe bang tai chua xac nhan.
- [x] Chot luat "dang phat dai thi autoplay va fallback phai nhuong": dai YouTube live (khong phai `http`) cung duoc tinh la dang phat dai, khong bi thay bang bai lien quan, va bao loi dung la loi dai.
- [x] Them listener `client.on("error")` + bat loi khi tra loi tuong tac chon dai: mot loi mang/API khong duoc tat bot.
- [x] Tim ra nguyen nhan "doi dai thanh cong nhung bao loi": `IS_COMPONENTS_V2` phai gui o chinh lan tao components (Discord bo qua flag nay o buoc defer) — xem `RADIO_REPLY_FLAGS`; them test guard cho radio + `/play`.
- [ ] Nguoi dung restart bot (`npm start`, dist da build san) va chon dai lai trong Discord de xac nhan khong con bao loi.

## YouTube-inspired music UI — 2026-09-13

- [x] Reorder media, playback summary, controls and secondary details in shared native V2 renderer.
- [x] Centralize heading/control icons and unify metadata typography; expose repeat mode in labels.
- [x] Verify timeline edge cases, image fallback, actual component limits and regression suite; regenerate preview.
- [ ] Restart bot and check Discord desktop/mobile rendering.

Scope: [music UI plan](../plans/20260913-youtube-music-ui/plan.md).

## Weather — 2026-09-13

- [x] Review Overmorrow and official Open-Meteo APIs; implement independent provider integration.
- [x] Add slash/prefix weather, owner-bound location menu and native V2 current/hourly/daily forecast.
- [x] Verify local-time/missing-data/error/ownership behavior, build and 197 tests; smoke-test live Hanoi API.
- [ ] Register new slash command, restart deployed bot and verify Discord desktop/mobile rendering.

Scope: [weather plan](../plans/20260913-weather/plan.md).

## Ping accuracy — 2026-09-13

- [x] Replace cross-clock subtraction with monotonic HTTP reply timing for slash/prefix commands.
- [x] Correct heartbeat label and unavailable state; preserve V2 visibility and no-ping.
- [x] Verify clock-skew regressions, build and complete test suite.

## Components V2 rebuild — 2026-09-13

- [x] Replace shared embed-style renderer with native V2 serialization and message budgets.
- [x] Unify music cards; redesign queue, help, radio, bot info and command feedback.
- [x] Build and verify payloads plus existing behavior: 185 tests / 23 files.
- [x] Document behavior and generate [layout preview](../plans/20260913-components-v2-rebuild/preview.html).
- [ ] Restart deployed bot and visually verify Discord desktop/mobile with real artwork.

Scope: [rebuild plan](../plans/20260913-components-v2-rebuild/plan.md).

## Requester RPC — 2026-09-12

- [x] Implement optional OAuth PKCE, user Gateway and commands.
- [x] Synchronize playback activity and clear stale requester presence.
- [x] Build and local automated verification (99 tests).
- [x] Document setup and PoC limits.
- [ ] Configure Discord application and reachable callback; deploy slash commands.
- [ ] Verify real OAuth consent and profile display, pause/resume, stop and disconnect.

Scope and implementation details: [RPC plan](../plans/20260912-2038-discord-requester-rich-presence/plan.md).
