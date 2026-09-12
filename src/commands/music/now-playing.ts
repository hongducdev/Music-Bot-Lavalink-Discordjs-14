import { SlashCommandBuilder } from "discord.js";
import type { Player } from "lavalink-client";
import type { Command } from "../../types/command.js";
import {
  DELETE_AFTER,
  EMBED_COLORS,
  embed,
  privateReplyAndCleanup,
  silentReplyAndCleanup,
  type MessageContainerBuilder,
} from "../../utils/embed.js";
import {
  artworkUrl,
  formatDuration,
  formatTrackDuration,
  playerStatus,
  requesterName,
  trackLink,
} from "../../utils/text.js";
import { buildMusicController } from "../../music/controller.js";
import { isAutoplayEnabled } from "../../music/autoplay.js";

function buildNowPlayingEmbed(player: Player): MessageContainerBuilder {
  const current = player.queue.current!;
  const info = current.info;

  const builder = embed(
    `▶️ | Đang phát:\n> ${trackLink(info)}`,
    EMBED_COLORS.default,
    "Now playing"
  ).addFields(
    {
      name: "🔷 | Trạng thái",
      value: playerStatus({
        volume: player.volume,
        paused: player.paused,
        autoplay: isAutoplayEnabled(player.guildId),
      }),
      inline: false,
    },
    { name: "👌 | Yêu cầu bởi", value: requesterName(current.requester), inline: false }
  );

  // Kenh + thoi luong thuoc ve bai hat, de trong Section cho anh bia can deu thay vi lap lai o fields.
  builder.setSectionNote(
    `🎵 ${info.author || "Không rõ"} · ⏱️ ${formatDuration(player.position)} / ${formatTrackDuration(info.duration)}`
  );
  builder.setFooter({ text: `${player.queue.tracks.length} bài trong hàng đợi` });
  const thumbnail = artworkUrl(info);
  if (thumbnail) builder.setThumbnail(thumbnail, `Ảnh bìa bài hát ${info.title}`);
  return builder;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Xem thông tin bài hát đang phát"),
  aliases: ["np"],
  async execute(interaction) {
    const player = interaction.client.lavalink.getPlayer(interaction.guildId!);
    if (!player?.queue.current) {
      await privateReplyAndCleanup(
        interaction,
        embed("🚫 | Hiện không có bài nào đang phát.", EMBED_COLORS.error, "Now playing")
      );
      return;
    }

    await privateReplyAndCleanup(
      interaction,
      buildNowPlayingEmbed(player),
      DELETE_AFTER.nowPlaying,
      [buildMusicController(player)]
    );
  },
  async executeMessage(message) {
    const player = message.client.lavalink.getPlayer(message.guildId!);
    if (!player?.queue.current) {
      await silentReplyAndCleanup(
        message,
        embed("🚫 | Hiện không có bài nào đang phát.", EMBED_COLORS.error, "Now playing")
      );
      return;
    }

    await silentReplyAndCleanup(
      message,
      buildNowPlayingEmbed(player),
      DELETE_AFTER.nowPlaying,
      [buildMusicController(player)]
    );
  },
};
