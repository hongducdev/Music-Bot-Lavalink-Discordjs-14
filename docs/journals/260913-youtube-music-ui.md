# Music UI consistency

Cause: per-command emojis plus renderer ordering obscured playback controls and mixed label styles.
Change: shared heading/control vocabulary, undecorated metadata labels, media-first card with compact timeline and controls ahead of secondary fields. Playback/queue/add-track use music red.
Checks: production-builder payload assertions, bounded progress for negative/overshoot/non-finite position, live-stream fallback, repeat labels and icon normalization; existing suites cover 40-component/4000-character limits.
Limits: native Discord layout, snapshot progress. Preview uses illustrative data; no live Discord visual acceptance or restart. No dependencies added.
