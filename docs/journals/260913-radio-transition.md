# Music to radio transition

Diagnosis: shared radio helper queued a station then stopped/skipped the old track. Completion depended on a subsequent trackEnd event. If playing=false but queue.current exists (including paused music), plain play() reuses the old current track. Queue-repeat can also retain the previous music.

Fix: explicit clientTrack replacement with paused=false and position=0, queue API clearing and repeat off. Restore local prior selection/current/queue/repeat on request failure. All three radio entry points reuse this helper.

Verification: tests use installed Player/Queue implementation; search and REST transport stubbed at external boundaries. Cover playing, paused, idle-current, no station result and rejected replacement. No live Discord audio test. Existing log also contains YouTube HTTP 400 and expired station TLS errors; this change does not repair upstream streams.
