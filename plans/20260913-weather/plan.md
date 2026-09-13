# Weather Components V2

- [x] Read bot flow and Overmorrow/Open-Meteo sources.
- [x] Add validated Open-Meteo search/forecast client, no new dependencies.
- [x] Add Vietnamese V2 card, slash/prefix command and owner-bound location menu.
- [x] Check API failures, missing data, local dates, menu ownership; build/test and live API smoke.
- [x] Review changes and update README/changelog/roadmap.

Scope: current conditions, next six forecast hours, seven days. Reuse shared native Discord container. No copying Overmorrow code/assets. No API keys or Discord deployment required for local verification.

Verification: build passes; 197 tests / 25 files. Live Hanoi search/get/forecast and card serialization succeeded. Reviewed routing, fixed API hosts, query validation, owner guard, defer-before-network, missing data and payload bounds directly (delegation tools unavailable). Docs impact: minor. Deployment/live Discord rendering remains an operational follow-up.
