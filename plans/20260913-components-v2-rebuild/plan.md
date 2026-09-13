# Components V2 rebuild

Reference: https://docs.discord.com/developers/components/reference

## Findings
- All message paths already use V2 flags; shared embed adapter dictates old layout.
- Adapter joins inline fields into long rows and exposes fake embed properties in JSON.
- Track-start and nowplaying duplicate presentation; queue list occupies thumbnail section.
- Baseline: npm test, 23 files / 184 tests pass. Working tree clean.
- No project CLAUDE.md or subagent tool available; execute and review locally.

## Tasks
- [x] Rebuild shared container layout with native serialized components, bounded text, artwork gallery, compact separators, actions before footer.
- [x] Share now-playing layout; redesign queue, help, radio, bot info, confirmations and controls.
- [x] Verify real builder payloads, boundary inputs, existing behavior; run build and full tests (185 tests / 23 files).
- [x] Update README, changelog, roadmap and record visual acceptance limits.

## Verification limits
- Browser URL policy blocked local-file preview. Preview HTML is an approximation with sample data, not Discord acceptance.
- Deployment restart/live Discord visual check not performed. Cards retain send-time state; `/nowplaying` refreshes.

## Acceptance
- Native V2 only; no content/embeds; existing private/public visibility and no-ping preserved.
- Music artwork → listening details → controls → footer; no decorative video or fabricated asset.
- Queue puts current track first; help and radio offer concise actionable sections.
- At most 40 components and 4000 combined text characters per message.
- No new dependencies. No live channel messages without explicit authorization.
