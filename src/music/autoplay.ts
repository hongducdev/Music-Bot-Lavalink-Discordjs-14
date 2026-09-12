interface Identifiable {
  info: { identifier?: string };
}

/** So bai da phat gan day cua moi guild, de autoplay khong lap lai. */
const HISTORY_SIZE = 30;
const history = new Map<string, string[]>();

export function rememberPlayed(guildId: string, identifier?: string): void {
  if (!identifier) return;
  const played = [...(history.get(guildId) ?? []), identifier].slice(-HISTORY_SIZE);
  // Xoa truoc khi set de guild giu thu tu LRU.
  history.delete(guildId);
  history.set(guildId, played);
}

export function playedIdentifiers(guildId: string): Set<string> {
  return new Set(history.get(guildId) ?? []);
}

/**
 * Chon ngau nhien mot bai chua phat gan day.
 * Het bai moi thi danh bo qua bai vua phat, khong tra ve chinh no.
 */
export function pickRelatedTrack<T extends Identifiable>(
  tracks: T[],
  lastIdentifier?: string,
  played: ReadonlySet<string> = new Set()
): T | null {
  const fresh = tracks.filter(
    (track) =>
      track.info.identifier !== lastIdentifier && !played.has(track.info.identifier ?? "")
  );
  const pool = fresh.length
    ? fresh
    : tracks.filter((track) => track.info.identifier !== lastIdentifier);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

interface Sourceable {
  info: { identifier?: string; uri?: string | null };
}

/**
 * Link "mix" (RD) cua YouTube: danh sach bai lien quan that su, khac han
 * tim theo ten bai (chi ra lai chinh bai do va cac ban upload trung).
 */
export function buildRadioQuery(track: Sourceable): string | null {
  const id = track.info.identifier;
  if (!id || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|music\.youtube\.com)\//.test(track.info.uri ?? "")) {
    return null;
  }
  return `https://www.youtube.com/watch?v=${id}&list=RD${id}`;
}

/** Tim theo ten kenh: rong hon "ten bai + kenh" nen tra ve nhieu bai khac nhau. */
export function buildRelatedQuery(track: {
  info: { title?: string; author?: string | null };
}): string {
  return track.info.author?.trim() || track.info.title?.trim() || "";
}

const disabledGuilds = new Set<string>();

export function isAutoplayEnabled(guildId: string): boolean {
  return !disabledGuilds.has(guildId);
}

export function setAutoplay(guildId: string, enabled: boolean): void {
  if (enabled) disabledGuilds.delete(guildId);
  else disabledGuilds.add(guildId);
}
