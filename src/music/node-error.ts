import { shortReason } from "../utils/text.js";

/**
 * Loi 401/403 khi mo WebSocket toi Lavalink gan nhu luon la sai mat khau,
 * khong phai loi mang - nen tra ve true de log goi y dung cho nguoi chay bot.
 */
export function isNodeAuthError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /\b(401|403)\b/.test(shortReason(message));
}

/** Goi y cach sua khi Lavalink tu choi xac thuc. */
export function authErrorHint(): string {
  return (
    "[Lavalink] 401/403 = sai mat khau. Chay Lavalink bang .\\lavalink\\start.ps1 de nap LAVALINK_PASSWORD tu .env " +
    "(chay `java -jar Lavalink.jar` truc tiep se dung mat khau mac dinh)."
  );
}
