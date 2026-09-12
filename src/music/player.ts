import { LavalinkManager, type Player, type Track, type UnresolvedTrack } from "lavalink-client";
import { MessageFlags, type APIEmbedField, type Client } from "discord.js";
import { config } from "../config.js";
import {
  formatTrackDuration,
  playerStatus,
  requesterName,
  shortReason,
  trackLink,
} from "../utils/text.js";
import { DELETE_AFTER, EMBED_COLORS, NO_PING, deleteAfter, embed } from "../utils/embed.js";
import {
  FALLBACK_SOURCES,
  buildFallbackQuery,
  firstMatch,
  markAsFallback,
  shouldFallback,
} from "./fallback.js";
import { isAutoplayEnabled, pickRelatedTrack } from "./autoplay.js";
import { authErrorHint, isNodeAuthError } from "./node-error.js";

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
    if (isNodeAuthError(error)) console.error(authErrorHint());
  });

  lavalink.on("trackStart", (player, track) => {
    const info = track?.info;
    notify(client, player.textChannelId, {
      description: `▶️ | Đang phát:\n> ${info ? trackLink(info) : "Không rõ"}`,
      author: "Now playing",
      thumbnail: info?.artworkUrl,
      fields: [
        {
          name: "🔷 | Trạng thái",
          value: playerStatus({
            volume: player.volume,
            paused: player.paused,
            autoplay: isAutoplayEnabled(player.guildId),
          }),
          inline: false,
        },
        { name: "⏱️ | Thời lượng", value: formatTrackDuration(info?.duration), inline: true },
        { name: "🎵 | Kênh", value: info?.author || "Không rõ", inline: true },
        { name: "👌 | Yêu cầu bởi", value: requesterName(track?.requester), inline: true },
      ],
      footer: `${player.queue.tracks.length} bài trong hàng đợi`,
      deleteAfterMs: DELETE_AFTER.nowPlaying,
    });
  });

  lavalink.on("trackError", (player, track, payload) => {
    const reason = shortReason(payload?.exception?.message);
    void retryWithFallback(client, player, track, reason);
  });

  lavalink.on("trackStuck", (player, track) => {
    notify(client, player.textChannelId, {
      description: `⚠️ | Bài **${track?.info.title}** bị kẹt, mình bỏ qua nhé.`,
      author: "Cảnh báo",
      deleteAfterMs: DELETE_AFTER.error,
    });
  });

  lavalink.on("queueEnd", (player) => {
    notify(client, player.textChannelId, {
      description: "⏹️ | Đã phát hết danh sách. Thêm bài mới bằng `/play` nhé!",
      author: "Hết nhạc",
      deleteAfterMs: DELETE_AFTER.error,
    });
  });

  return lavalink;
}

interface NotifyOptions {
  description: string;
  author?: string;
  color?: number;
  thumbnail?: string | null;
  fields?: APIEmbedField[];
  footer?: string;
  /** Tu xoa thong bao sau ms. Bo trong = giu lai. */
  deleteAfterMs?: number;
}

function notify(
  client: Client,
  channelId: string | null | undefined,
  options: NotifyOptions
): void {
  if (!channelId) return;
  const channel = client.channels.cache.get(channelId);
  if (!channel?.isSendable()) return;

  const builder = embed(options.description, options.color ?? EMBED_COLORS.default, options.author);
  if (options.thumbnail) builder.setThumbnail(options.thumbnail);
  if (options.fields?.length) builder.addFields(options.fields);
  if (options.footer) builder.setFooter({ text: options.footer });

  channel
    .send({
      embeds: [builder],
      // Thong bao cua bot khong bao gio ping ai: mention trong embed chi de hien thi.
      allowedMentions: NO_PING,
      flags: MessageFlags.SuppressNotifications,
    })
    .then((sent) => {
      if (options.deleteAfterMs) deleteAfter(() => sent.delete(), options.deleteAfterMs);
    })
    .catch((error: Error) => {
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
          description: `🔁 | YouTube chặn **${track!.info.title}**.\nĐã chuyển sang nguồn khác:\n> ${trackLink(next.info)}`,
          author: "Đổi nguồn phát",
          thumbnail: next.info.artworkUrl,
          deleteAfterMs: DELETE_AFTER.error,
        });
        if (!player.playing) await player.play();
        return;
      }
    }

    notify(client, player.textChannelId, {
      description: `🚫 | **${track?.info.title}**\n\nYouTube chặn stream nguồn này (${reason}). Thử video khác nhé!`,
      author: "Không phát được",
      color: EMBED_COLORS.error,
      deleteAfterMs: DELETE_AFTER.error,
    });
  } catch (error) {
    console.error("[fallback] Lỗi khi thử nguồn khác:", error);
    notify(client, player.textChannelId, {
      description: `🚫 | **${track?.info.title}**\n\nYouTube chặn stream nguồn này (${reason}).`,
      author: "Không phát được",
      color: EMBED_COLORS.error,
      deleteAfterMs: DELETE_AFTER.error,
    });
  }
}
