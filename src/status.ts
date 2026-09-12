import { ActivityType, type Client } from "discord.js";

/** Ten tac gia hien trong status xoay vong. */
export const BOT_AUTHOR = "hongduc.dev";

/** Doi status moi 30s. Discord cho ~5 lan/20s moi session nen 30s la an toan. */
const ROTATE_MS = 30_000;

export interface BotStatus {
  name: string;
  type: ActivityType;
}

/** Status xoay vong: ping, quy mo bot, cach dung, tac gia. */
export function buildStatuses(client: Client, prefix: string): BotStatus[] {
  const guilds = client.guilds.cache.size;
  const members = client.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0);

  return [
    { name: `🏓 Ping: ${client.ws.ping}ms`, type: ActivityType.Watching },
    { name: `🌐 ${guilds} server • ${members} thành viên`, type: ActivityType.Watching },
    { name: `💬 ${prefix}play + /play`, type: ActivityType.Listening },
    { name: `👤 Tác giả: ${BOT_AUTHOR}`, type: ActivityType.Watching },
  ];
}

/** Bat dau xoay vong status. Goi mot lan trong ClientReady; tra ve timer de dung lai. */
export function startStatusRotation(
  client: Client,
  prefix: string,
  intervalMs: number = ROTATE_MS
): NodeJS.Timeout {
  let index = 0;

  const tick = (): void => {
    const statuses = buildStatuses(client, prefix);
    const status = statuses[index % statuses.length];
    index += 1;
    client.user?.setActivity(status.name, { type: status.type });
  };

  tick();
  return setInterval(tick, intervalMs);
}
