import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ButtonInteraction,
  type GuildMember,
} from "discord.js";
import type { Player } from "lavalink-client";
import { EMBED_COLORS, embed, privateReplyAndCleanup } from "../utils/embed.js";
import { nextRepeatMode, repeatModeMessage } from "../commands/music/loop.js";

export const MUSIC_CONTROLLER_IDS = {
  playPause: "ctrl_play_pause",
  skip: "ctrl_skip",
  shuffle: "ctrl_shuffle",
  loop: "ctrl_loop",
  stop: "ctrl_stop",
} as const;

export function buildMusicController(player?: Player | null): ActionRowBuilder<ButtonBuilder> {
  const isPaused = player?.paused ?? false;

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(MUSIC_CONTROLLER_IDS.playPause)
      .setEmoji("⏯️")
      .setLabel(isPaused ? "Tiếp tục" : "Tạm dừng")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(MUSIC_CONTROLLER_IDS.skip)
      .setEmoji("⏭️")
      .setLabel("Bỏ qua")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(MUSIC_CONTROLLER_IDS.shuffle)
      .setEmoji("🔀")
      .setLabel("Trộn")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(MUSIC_CONTROLLER_IDS.loop)
      .setEmoji("🔁")
      .setLabel("Lặp")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(MUSIC_CONTROLLER_IDS.stop)
      .setEmoji("⏹️")
      .setLabel("Dừng")
      .setStyle(ButtonStyle.Danger)
  );
}

export async function handleMusicController(
  interaction: ButtonInteraction
): Promise<boolean> {
  const { customId, guildId } = interaction;
  const isMusicButton = Object.values(MUSIC_CONTROLLER_IDS).includes(
    customId as (typeof MUSIC_CONTROLLER_IDS)[keyof typeof MUSIC_CONTROLLER_IDS]
  );
  if (!isMusicButton) return false;

  const player = interaction.client.lavalink.getPlayer(guildId!);
  if (!player) {
    await privateReplyAndCleanup(
      interaction,
      embed("🚫 | Hiện không có nhạc đang phát ở server này.", EMBED_COLORS.error, "Controller")
    );
    return true;
  }

  const member = interaction.member as GuildMember | null;
  const memberVoiceChannelId = member?.voice?.channelId;

  if (!memberVoiceChannelId) {
    await privateReplyAndCleanup(
      interaction,
      embed("🚫 | Bạn cần vào kênh thoại trước đã!", EMBED_COLORS.error, "Controller")
    );
    return true;
  }

  if (player.voiceChannelId && memberVoiceChannelId !== player.voiceChannelId) {
    await privateReplyAndCleanup(
      interaction,
      embed(
        "🚫 | Bạn phải ở cùng kênh thoại với bot mới điều khiển được nhé.",
        EMBED_COLORS.error,
        "Controller"
      )
    );
    return true;
  }

  switch (customId) {
    case MUSIC_CONTROLLER_IDS.playPause: {
      if (player.paused) {
        await player.resume();
        await privateReplyAndCleanup(
          interaction,
          embed("▶️ | Đã tiếp tục phát nhạc.", EMBED_COLORS.default, "Play")
        );
      } else {
        await player.pause();
        await privateReplyAndCleanup(
          interaction,
          embed("⏸️ | Đã tạm dừng nhạc.", EMBED_COLORS.default, "Pause")
        );
      }
      break;
    }

    case MUSIC_CONTROLLER_IDS.skip: {
      if (!player.queue.current) {
        await privateReplyAndCleanup(
          interaction,
          embed("🚫 | Không có bài nào đang phát để bỏ qua.", EMBED_COLORS.error, "Skip")
        );
        return true;
      }
      const skipped = player.queue.current.info.title;
      await player.skip(0, false);
      await privateReplyAndCleanup(
        interaction,
        embed(`⏩ | Đã bỏ qua:\n> **${skipped}**`, EMBED_COLORS.default, "Skip")
      );
      break;
    }

    case MUSIC_CONTROLLER_IDS.shuffle: {
      if (player.queue.tracks.length < 2) {
        await privateReplyAndCleanup(
          interaction,
          embed("⚠️ | Hàng đợi cần ít nhất **2** bài để xáo trộn.", EMBED_COLORS.error, "Shuffle")
        );
        return true;
      }
      await player.queue.shuffle();
      await privateReplyAndCleanup(
        interaction,
        embed(
          `🔀 | Đã xáo trộn **${player.queue.tracks.length}** bài hát trong hàng đợi.`,
          EMBED_COLORS.default,
          "Shuffle"
        )
      );
      break;
    }

    case MUSIC_CONTROLLER_IDS.loop: {
      const targetMode = nextRepeatMode(player.repeatMode);
      await player.setRepeatMode(targetMode);
      await privateReplyAndCleanup(
        interaction,
        embed(repeatModeMessage(targetMode), EMBED_COLORS.default, "Loop")
      );
      break;
    }

    case MUSIC_CONTROLLER_IDS.stop: {
      await player.destroy("User stopped via button controller");
      await privateReplyAndCleanup(
        interaction,
        embed("⏹️ | Đã dừng phát nhạc, xoá hàng đợi và rời kênh thoại.", EMBED_COLORS.default, "Stop")
      );
      break;
    }
  }

  return true;
}
