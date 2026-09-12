import type { SearchPlatform, anyObject } from "lavalink-client";

/** Nguon backup dung khi YouTube chan stream, thu theo thu tu trong mang. */
export const FALLBACK_SOURCES: readonly SearchPlatform[] = ["scsearch"];

/** Tra ve ket qua dau tien tim duoc; bo qua nguon loi hoac rong. */
export async function firstMatch<S extends string, T>(
  sources: readonly S[],
  search: (source: S) => Promise<T[]>
): Promise<{ source: S; match: T } | null> {
  for (const source of sources) {
    try {
      const results = await search(source);
      if (results.length) return { source, match: results[0] };
    } catch (error) {
      console.error(`[fallback] Nguon ${source} loi:`, error);
    }
  }
  return null;
}

interface TrackLike {
  info: { title?: string; author?: string | null; sourceName?: string };
  userData?: unknown;
}

/**
 * Stream phat bang link truc tiep (dai radio HLS/m3u8).
 * Loai nay khong co metadata that (title/author do minh tu gan) nen moi tro
 * giup dua vao ten bai deu sai: search lai theo ten chi ra bai hat lung tung.
 */
export function isDirectStream(track?: TrackLike | null): boolean {
  const source = track?.info?.sourceName;
  return source === "http" || source === "local";
}

export function buildFallbackQuery(track: TrackLike): string {
  const title = track.info.title?.trim() ?? "";
  const author = track.info.author?.trim();
  return author ? `${title} ${author}` : title;
}

/**
 * Chi thu fallback mot lan cho moi bai, tranh vong lap vo han.
 * Stream tu link truc tiep thi khong thay the duoc bang search theo ten.
 */
export function shouldFallback(track?: TrackLike | null): boolean {
  if (!track || isDirectStream(track)) return false;
  return !(track.userData as anyObject | undefined)?.fallback;
}

export function markAsFallback(userData: unknown): anyObject {
  const base =
    typeof userData === "object" && userData !== null
      ? (userData as anyObject)
      : {};
  // anyObject khong cho phep boolean trong index signature, nen phai ep qua unknown.
  return { ...base, fallback: true } as unknown as anyObject;
}
