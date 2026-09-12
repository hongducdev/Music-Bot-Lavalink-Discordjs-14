import { LavalinkManager, type Player, type Track, type UnresolvedTrack } from "lavalink-client";
import type { Client } from "discord.js";
import { config } from "../config.js";
import { clip, shortReason } from "../utils/text.js";
import { EMBED_COLORS, embed } from "../utils/embed.js";
import {
  FALLBACK_SOURCES,
  buildFallbackQuery,
  firstMatch,
  markAsFallback,
  shouldFallback,
} from "./fallback.js";
import { isAutoplayEnabled, pickRelatedTrack } from "./autoplay.js";

declare module "discord.js" {
  interface Client {
    lavalink: LavalinkManager;
  }
}

export function createLavalink(client: Client): LavalinkManager {
  const lavalink = new LavalinkManager({
    nodes: [
      {
        authorization: config.lavalink.authorization,
        host: config.lavalink.host,
        port: config.lavalink.port,
        secure: config.lavalink.secure,
        id: "main-node",
      },
    ],
    sendToShard: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    },
    autoSkip: true,
    client: {
      id: config.clientId,
      username: "MusicBot",
    },
    playerOptions: {
      defaultSearchPlatform: "ytsearch",
      onEmptyQueue: {
        destroyAfterMs: 30_000,
        autoPlayFunction: async (player, lastPlayedTrack) => {
          await queueRelatedTrack(player, lastPlayedTrack);
        },
      },
    },
  });

  lavalink.nodeManager.on("connect", (node) => {
    console.log(`[Lavalink] Node ${node.id} connected`);
  });

  lavalink.nodeManager.on("error", (node, error) => {
    console.error(`[Lavalink] Node ${node.id} error:`, error);
  });

  lavalink.on("trackStart", (player, track) => {
    notify(client, player.textChannelId, {
      description: `**${track?.info.title}**\n${track?.info.author ?? ""}`,
      title: "🎶 Đang phát",
      thumbnail: track?.info.artworkUrl,
    });
  });

  lavalink.on("trackError", (player, track, payload) => {
    const reason = shortReason(payload?.exception?.message);
    void retryWithFallback(client, player, track, reason);
  });

  lavalink.on("trackStuck", (player, track) => {
    notify(client, player.textChannelId, {
      description: `Bài **${track?.info.title}** bị kẹt, mình bỏ qua nhé.`,
      title: "⚠️ Cảnh báo",
      color: EMBED_COLORS.warning,
    });
  });

  lavalink.on("queueEnd", (player) => {
    notify(client, player.textChannelId, {
      description: "Đã phát hết danh sách. Thêm bài mới bằng `/play` nhé!",
      title: "⏹️ Hết nhạc",
    });
  });

  return lavalink;
}

interface NotifyOptions {
  description: string;
  title?: string;
  color?: number;
  thumbnail?: string | null;
}

function notify(
  client: Client,
  channelId: string | null | undefined,
  options: NotifyOptions
): void {
  if (!channelId) return;
  const channel = client.channels.cache.get(channelId);
  if (!channel?.isSendable()) return;

  const builder = embed(options.description, options.color ?? EMBED_COLORS.info, options.title);
  if (options.thumbnail) builder.setThumbnail(options.thumbnail);

  channel.send({ embeds: [builder] }).catch((error: Error) => {
    console.error("[notify] Không gửi được thông báo:", error.message);
  });
}

/** Het hang doi thi tu tim bai lien quan va them vao hang doi. */
async function queueRelatedTrack(
  player: Player,
  lastPlayedTrack: Track | UnresolvedTrack | null | undefined
): Promise<void> {
  if (!lastPlayedTrack || !isAutoplayEnabled(player.guildId)) return;

  try {
    const res = await player.search(
      { query: buildFallbackQuery(lastPlayedTrack), source: "ytmsearch" },
      lastPlayedTrack.userData
    );
    const next = pickRelatedTrack<Track | UnresolvedTrack>(
      res.tracks,
      lastPlayedTrack.info.identifier
    );
    if (next) player.queue.add(next);
  } catch (error) {
    console.error("[autoplay] Không tìm được bài liên quan:", error);
  }
}

/** YouTube chan stream thi thu tim bai tuong tu o cac nguon khac. */
async function retryWithFallback(
  client: Client,
  player: Player,
  track: Track | UnresolvedTrack | null | undefined,
  reason: string
): Promise<void> {
  try {
    if (shouldFallback(track)) {
      const query = buildFallbackQuery(track!);
      const found = await firstMatch(
        FALLBACK_SOURCES,
        async (source): Promise<(Track | UnresolvedTrack)[]> => {
          const res = await player.search({ query, source }, track?.userData);
          return res.tracks;
        }
      );

      if (found) {
        const next = found.match;
        next.userData = markAsFallback(next.userData);
        player.queue.add(next, 0);
        notify(client, player.textChannelId, {
          description: `YouTube chặn **${track!.info.title}**.\nĐã chuyển sang nguồn khác: **${next.info.title}**`,
          title: "🔁 Đổi nguồn phát",
          color: EMBED_COLORS.warning,
          thumbnail: next.info.artworkUrl,
        });
        if (!player.playing) await player.play();
        return;
      }
    }

    notify(client, player.textChannelId, {
      description: `**${track?.info.title}**\n\nYouTube chặn stream nguồn này (${reason}). Thử video khác nhé!`,
      title: "❌ Không phát được",
      color: EMBED_COLORS.error,
    });
  } catch (error) {
    console.error("[fallback] Lỗi khi thử nguồn khác:", error);
    notify(client, player.textChannelId, {
      description: `**${track?.info.title}**\n\nYouTube chặn stream nguồn này (${reason}).`,
      title: "❌ Không phát được",
      color: EMBED_COLORS.error,
    });
  }
}
