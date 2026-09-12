const DISCORD_LIMIT = 2000;

/** Lay dong dau tien cua message, bo stack trace nhieu dong. */
export function shortReason(message?: string | null): string {
  const firstLine = (message ?? "").split(/\r?\n/)[0].trim();
  return firstLine ? firstLine.slice(0, 200) : "unknown";
}

/** Cat bot noi dung theo gioi han 2000 ky tu cua Discord. */
export function clip(content: string, limit: number = DISCORD_LIMIT): string {
  return content.length <= limit ? content : `${content.slice(0, limit - 3)}...`;
}

/** Dinh dang mili-giay thanh m:ss hoac h:mm:ss. */
export function formatDuration(ms?: number | null): string {
  const total = Math.floor(Math.max(ms ?? 0, 0) / 1000);
  const seconds = String(total % 60).padStart(2, "0");
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);

  if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`;
  return `${minutes}:${seconds}`;
}

/** Thoi luong bai hat: 0 hoac thieu nghia la stream truc tiep. */
export function formatTrackDuration(ms?: number | null): string {
  return ms ? formatDuration(ms) : "Trực tiếp";
}

interface TrackTextInfo {
  title: string;
  uri?: string | null;
}

/** Link markdown toi bai hat, hoac chi ten neu thieu uri. */
export function trackLink(info: TrackTextInfo): string {
  return info.uri ? `[${info.title}](${info.uri})` : info.title;
}

interface TrackArtInfo {
  identifier?: string;
  artworkUrl?: string | null;
  uri?: string | null;
}

/**
 * Anh bia bai hat. Lavalink tra artworkUrl rong voi ket qua `ytsearch`,
 * nen lay thumbnail YouTube tu video id lam du phong.
 */
export function artworkUrl(info: TrackArtInfo): string | null {
  if (info.artworkUrl) return info.artworkUrl;
  if (!info.identifier || !/youtu\.?be/.test(info.uri ?? "")) return null;
  return `https://i.ytimg.com/vi/${info.identifier}/hqdefault.jpg`;
}

/** Mention nguoi yeu cau phat bai hat, hoac username neu khong co id. */
export function requesterName(requester?: unknown): string {
  const user = requester as { id?: string; username?: string } | null | undefined;
  if (user?.id) return `<@${user.id}>`;
  return user?.username ?? "Không rõ";
}

/** Dong trang thai cua player, giong `status(queue)` ben repo tham khao. */
export function playerStatus(state: {
  volume: number;
  paused: boolean;
  autoplay: boolean;
}): string {
  return (
    `Âm lượng: \`${state.volume}%\` | Tạm dừng: \`${state.paused ? "Có" : "Không"}\`` +
    ` | Autoplay: \`${state.autoplay ? "Bật" : "Tắt"}\``
  );
}
