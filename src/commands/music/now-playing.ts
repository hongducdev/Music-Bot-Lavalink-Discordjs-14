import { SlashCommandBuilder, type EmbedBuilder } from "discord.js";
import type { Player } from "lavalink-client";
import type { Command } from "../../types/command.js";
import {
  DELETE_AFTER,
  EMBED_COLORS,
  embed,
  privateReplyAndCleanup,
  silentReplyAndCleanup,
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

function buildNowPlayingEmbed(player: Player): EmbedBuilder {
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
    {
      name: "⏱️ | Thời lượng",
      value: `${formatDuration(player.position)} / ${formatTrackDuration(info.duration)}`,
      inline: true,
    },
    { name: "🎵 | Kênh", value: info.author || "Không rõ", inline: true },
    { name: "👌 | Yêu cầu bởi", value: requesterName(current.requester), inline: true }
  );

  builder.setFooter({ text: `${player.queue.tracks.length} bài trong hàng đợi` });
  const thumbnail = artworkUrl(info);
  if (thumbnail) builder.setThumbnail(thumbnail);
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
