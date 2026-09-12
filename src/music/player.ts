import { LavalinkManager, type Player, type Track, type UnresolvedTrack } from "lavalink-client";
import {
  ActionRowBuilder,
  ButtonBuilder,
  MessageFlags,
  type APIEmbedField,
  type Client,
} from "discord.js";
import { config } from "../config.js";
import {
  artworkUrl,
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
  isDirectStream,
  markAsFallback,
  shouldFallback,
} from "./fallback.js";
import {
  buildRadioQuery,
  buildRelatedQuery,
  isAutoplayEnabled,
  pickRelatedTrack,
  playedIdentifiers,
  rememberPlayed,
} from "./autoplay.js";
import { buildMusicController } from "./controller.js";
import {
  clearActiveRadio,
  decideRadioEnd,
  getActiveRadio,
  markRadioStarted,
  tagRadioTrack,
} from "./radio.js";
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
    rememberPlayed(player.guildId, track?.info.identifier);
    if (isDirectStream(track)) markRadioStarted(player.guildId);
    const info = track?.info;
    notify(client, player.textChannelId, {
      description: `▶️ | Đang phát:\n> ${info ? trackLink(info) : "Không rõ"}`,
      author: "Now playing",
      thumbnail: info ? artworkUrl(info) : null,
      sectionNote: `🎵 ${info?.author || "Không rõ"} · ⏱️ ${formatTrackDuration(info?.duration)}`,
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
        { name: "👌 | Yêu cầu bởi", value: requesterName(track?.requester), inline: false },
      ],
      footer: `${player.queue.tracks.length} bài trong hàng đợi`,
      components: [buildMusicController(player)],
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
    void handleQueueEnd(client, player);
  });

  return lavalink;
}

/**
 * Hang doi het. Neu dang phat dai 24/7 thi tu phat lai thay vi de nguoi dung
 * nhan "Het nhac" kho hieu — tru khi dai dut lien tuc qua nhieu lan.
 */
async function handleQueueEnd(client: Client, player: Player): Promise<void> {
  const station = getActiveRadio(player.guildId);

  if (station) {
    const decision = decideRadioEnd(player.guildId);
    if (decision.retry) {
      try {
        const res = await player.search({ query: station.query }, undefined);
        const next = res.tracks[0];
        if (next) {
          tagRadioTrack(next, station);
          player.queue.add(next, 0);
          await player.play();
          return;
        }
      } catch (error) {
        console.error("[radio] Không phát lại được đài:", error);
      }
    }

    // Het luot thu, hoac lan thu lai cung khong bat duoc luong -> bao ro. Luu y
    // KHONG bao "Het nhac": nguoi dung vua xin phat dai 24/7, khong phai het bai.
    clearActiveRadio(player.guildId);
    notify(client, player.textChannelId, {
      description:
        `🚫 | Đài **${station.name}** không giữ được luồng phát.\n` +
        "Thử đài khác bằng `/radio` nhé!",
      author: "Đài lỗi",
      color: EMBED_COLORS.error,
      deleteAfterMs: DELETE_AFTER.error,
    });
    return;
  }

  notify(client, player.textChannelId, {
    description: "⏹️ | Đã phát hết danh sách. Thêm bài mới bằng `/play` nhé!",
    author: "Hết nhạc",
    deleteAfterMs: DELETE_AFTER.error,
  });
}

interface NotifyOptions {
  description: string;
  author?: string;
  color?: number;
  thumbnail?: string | null;
  /** Dong bo sung trong Section, chi hien khi co thumbnail. */
  sectionNote?: string;
  fields?: APIEmbedField[];
  footer?: string;
  components?: ActionRowBuilder<ButtonBuilder>[];
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
  if (options.thumbnail) builder.setThumbnail(options.thumbnail, "Ảnh bìa bài hát");
  if (options.sectionNote) builder.setSectionNote(options.sectionNote);
  if (options.fields?.length) builder.addFields(options.fields);
  if (options.footer) builder.setFooter({ text: options.footer });
  // Nut nam trong container de dinh lien voi the bai hat, khong render roi ben ngoai.
  if (options.components?.length) builder.addActionRows(...options.components);

  channel
    .send({
      components: [builder],
      // Thong bao cua bot khong bao gio ping ai: mention trong embed chi de hien thi.
      allowedMentions: NO_PING,
      flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
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
  // Dai radio 24/7 khong co metadata that: tim "bai lien quan" theo ten dai chi
  // ra mot bai hat ngau nhien, lam card Now playing bi lap them lan nua.
  if (!lastPlayedTrack || isDirectStream(lastPlayedTrack)) return;
  if (!isAutoplayEnabled(player.guildId)) return;

  const played = playedIdentifiers(player.guildId);

  // Uu tien "mix" cua YouTube (danh sach bai lien quan that su). Mix loi hoac
  // rong thi lui ve tim theo ten kenh, rong hon "ten bai + kenh" nhieu.
  const attempts: { query: string; source?: "ytmsearch" }[] = [];
  const radio = buildRadioQuery(lastPlayedTrack);
  if (radio) attempts.push({ query: radio });
  attempts.push({ query: buildRelatedQuery(lastPlayedTrack), source: "ytmsearch" });

  for (const attempt of attempts) {
    if (!attempt.query) continue;
    try {
      const res = await player.search(attempt, lastPlayedTrack.requester);
      const next = pickRelatedTrack<Track | UnresolvedTrack>(
        res.tracks,
        lastPlayedTrack.info.identifier,
        played
      );
      if (next) {
        player.queue.add(next);
        return;
      }
    } catch (error) {
      console.error("[autoplay] Không tìm được bài liên quan:", error);
    }
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
          const res = await player.search({ query, source }, track?.requester);
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
          thumbnail: artworkUrl(next.info),
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
