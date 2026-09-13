# Accurate ping measurement

- Root cause: both ping handlers subtract Discord timestamps from local Date.now(). Clock skew can produce negative values; this measures neither HTTP RTT nor heartbeat RTT.
- client.ws.ping is average Gateway heartbeat latency, mislabeled as API Latency.
- Baseline: 185 tests pass; no dedicated ping tests.
- No subagent tool available; implement and review locally.

## Tasks
- [x] Reproduce clock-skew regression for slash and prefix paths (5 tests fail before fix).
- [x] Time the awaited initial reply with performance.now(); edit the same V2 message with the result.
- [x] Label HTTP reply measurement and Gateway heartbeat distinctly; report unavailable heartbeat honestly.
- [x] Build, run tests, review visibility/error paths and update docs.

HTTP measurement includes SDK queue/retries, request processing and network latency. It excludes the final display edit and does not measure the user's connection.
