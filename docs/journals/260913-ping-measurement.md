# Ping measurement — 2026-09-13

- Both ping entry points subtracted Discord-created timestamps from the host wall clock. Negative readings were possible and did not represent round-trip latency.
- Time one awaited reply using performance.now(), then edit that response. HTTP latency includes SDK queueing, API processing and network; final edit is outside the sample.
- client.ws.ping remains the library's average Gateway heartbeat, with unknown values explicitly marked unavailable. Process uptime retained.
- New tests fail on old code and pass after the fix: clock skew/rollback on slash and prefix, -1/NaN/Infinity heartbeat, rejected sends. Build and full suite checked locally; no Discord messages or restart performed.
