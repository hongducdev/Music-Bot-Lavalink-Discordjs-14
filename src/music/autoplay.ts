import type { Track, UnresolvedTrack } from "lavalink-client";

interface Identifiable {
  info: { identifier?: string };
}

/** Chon bai lien quan: bo qua chinh bai vua phat. */
export function pickRelatedTrack<T extends Identifiable>(
  tracks: T[],
  lastIdentifier?: string
): T | null {
  return tracks.find((track) => track.info.identifier !== lastIdentifier) ?? null;
}

const disabledGuilds = new Set<string>();

export function isAutoplayEnabled(guildId: string): boolean {
  return !disabledGuilds.has(guildId);
}

export function setAutoplay(guildId: string, enabled: boolean): void {
  if (enabled) disabledGuilds.delete(guildId);
  else disabledGuilds.add(guildId);
}

export type AnyTrack = Track | UnresolvedTrack;
