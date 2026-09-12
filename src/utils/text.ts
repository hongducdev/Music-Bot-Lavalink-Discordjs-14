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
