import { SlashCommandBuilder, MessageFlags, escapeMarkdown, type GuildMember } from "discord.js";
import type { Track, UnresolvedTrack } from "lavalink-client";
import type { Command } from "../../types/command.js";
import {
  DELETE_AFTER,
  EMBED_COLORS,
  NO_PING,
  embed,
  deleteAfter,
  privateReplyAndCleanup,
  silentReply,
  silentReplyAndCleanup,
} from "../../utils/embed.js";
import { formatTrackDuration, requesterName, trackLink, artworkUrl } from "../../utils/text.js";
import { clearActiveRadio } from "../../music/radio.js";
import {
  REQUIRED_TEXT_PERMISSIONS,
  REQUIRED_VOICE_PERMISSIONS,
  missingChannelPermissions,
} from "../../utils/permissions.js";

export type AnyTrack = Track | UnresolvedTrack;

function missingPermissionEmbed(scope: string, names: string[]) {
  return embed(
    `🚫 Mình thiếu quyền sau ở ${scope}:\n${names.map((name) => `• ${name}`).join("\n")}`,
    EMBED_COLORS.error,
    "Thiếu quyền"
  );
}

function addedTrackEmbed(track: AnyTrack) {
  const info = track.info;
  const builder = embed(
    trackLink(info),
    EMBED_COLORS.music,
    "Đã thêm vào hàng đợi"
  ).addFields(
    { name: "Thời lượng", value: formatTrackDuration(info.duration), inline: true },
    { name: "Nghệ sĩ", value: escapeMarkdown(info.author || "Không rõ"), inline: true },
    { name: "Yêu cầu bởi", value: requesterName(track.requester), inline: true }
  );

  const thumbnail = artworkUrl(info);
  if (thumbnail) builder.setThumbnail(thumbnail, `Ảnh bìa bài hát ${info.title}`);
  return builder;
}

function addedPlaylistEmbed(count: number, title: string) {
  return embed(
    `📥 Đã thêm **${count}** bài vào hàng đợi:\n> ${title}`,
    EMBED_COLORS.default,
    "Thêm playlist vào hàng đợi"
  );
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Phát nhạc từ link hoặc từ khoá tìm kiếm")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Link YouTube hoặc tên bài hát cần tìm")
        .setRequired(true)
    ),
  aliases: ["p"],
  async execute(interaction) {
    const member = interaction.member as GuildMember | null;
    const voiceChannel = member?.voice.channel;

    if (!voiceChannel) {
      await privateReplyAndCleanup(
        interaction,
        embed("🚫 Bạn cần vào một kênh thoại trước đã!", EMBED_COLORS.error, "Phát nhạc")
      );
      return;
    }

    const query = interaction.options.getString("query");
    if (!query) {
      await privateReplyAndCleanup(
        interaction,
        embed("✍️ Vui lòng nhập tên bài hát hoặc link nhé!", EMBED_COLORS.error, "Phát nhạc")
      );
      return;
    }

    const botMember = interaction.guild?.members.me;
    const missingVoice = missingChannelPermissions(
      REQUIRED_VOICE_PERMISSIONS,
      voiceChannel,
      botMember
    );
    if (missingVoice.length) {
      await privateReplyAndCleanup(
        interaction,
        missingPermissionEmbed(`kênh thoại **${voiceChannel.name}**`, missingVoice)
      );
      return;
    }

    const textChannel = interaction.channel;
    const missingText =
      textChannel && "permissionsFor" in textChannel
        ? missingChannelPermissions(REQUIRED_TEXT_PERMISSIONS, textChannel, botMember)
        : [];
    if (missingText.length) {
      await privateReplyAndCleanup(interaction, missingPermissionEmbed("kênh chat này", missingText));
      return;
    }

    // /play tra loi rieng cho nguoi go lenh; thong bao cong khai do card "Đang phát" dam nhiem.
    // IsComponentsV2 phai nam o chinh lan gui components: Discord bo qua flag nay
    // o buoc defer nen editReply thieu flag se bi tu choi.
    const replyFlags = MessageFlags.Ephemeral | MessageFlags.IsComponentsV2;
    await interaction.deferReply({ flags: replyFlags });

    clearActiveRadio(interaction.guildId!);

    const player =
      interaction.client.lavalink.getPlayer(interaction.guildId!) ||
      interaction.client.lavalink.createPlayer({
        guildId: interaction.guildId!,
        voiceChannelId: voiceChannel.id,
        textChannelId: interaction.channelId,
        selfDeaf: true,
      });

    if (!player.connected) {
      await player.connect();
    }

    const res = await player.search({ query }, interaction.user);

    if (!res.tracks.length) {
      await interaction.editReply({
        components: [embed(`😕 Không tìm thấy bài nào cho **${query}**.`, EMBED_COLORS.error, "Phát nhạc")],
        allowedMentions: NO_PING,
        flags: replyFlags,
      });
      deleteAfter(() => interaction.deleteReply(), DELETE_AFTER.error);
      return;
    }

    if (res.loadType === "playlist") {
      player.queue.add(res.tracks);
      await interaction.editReply({
        components: [addedPlaylistEmbed(res.tracks.length, res.playlist?.title || "Playlist")],
        allowedMentions: NO_PING,
        flags: replyFlags,
      });
    } else {
      player.queue.add(res.tracks[0]);
      await interaction.editReply({
        components: [addedTrackEmbed(res.tracks[0])],
        allowedMentions: NO_PING,
        flags: replyFlags,
      });
    }

    if (!player.playing) {
      await player.play();
    }
  },
  async executeMessage(message, args) {
    const voiceChannel = message.member?.voice.channel;

    if (!voiceChannel) {
      await silentReplyAndCleanup(
        message,
        embed("🚫 Bạn cần vào một kênh thoại trước đã!", EMBED_COLORS.error, "Phát nhạc")
      );
      return;
    }

    const query = args.join(" ").trim();
    if (!query) {
      await silentReplyAndCleanup(
        message,
        embed(
          "✍️ Vui lòng nhập tên bài hát hoặc link! Ví dụ: `!play faded`",
          EMBED_COLORS.error,
          "Phát nhạc"
        )
      );
      return;
    }

    const botMember = message.guild?.members.me;
    const missingVoice = missingChannelPermissions(
      REQUIRED_VOICE_PERMISSIONS,
      voiceChannel,
      botMember
    );
    const missingText = missingChannelPermissions(
      REQUIRED_TEXT_PERMISSIONS,
      "permissionsFor" in message.channel ? message.channel : null,
      botMember
    );

    if (missingVoice.length || missingText.length) {
      await silentReplyAndCleanup(
        message,
        missingVoice.length
          ? missingPermissionEmbed(`kênh thoại **${voiceChannel.name}**`, missingVoice)
          : missingPermissionEmbed("kênh chat này", missingText)
      );
      return;
    }

    clearActiveRadio(message.guildId!);

    const player =
      message.client.lavalink.getPlayer(message.guildId!) ||
      message.client.lavalink.createPlayer({
        guildId: message.guildId!,
        voiceChannelId: voiceChannel.id,
        textChannelId: message.channelId,
        selfDeaf: true,
      });

    if (!player.connected) {
      await player.connect();
    }

    const res = await player.search({ query }, message.author);

    if (!res.tracks.length) {
      await silentReplyAndCleanup(
        message,
        embed(`😕 Không tìm thấy bài nào cho **${query}**.`, EMBED_COLORS.error, "Phát nhạc")
      );
      return;
    }

    if (res.loadType === "playlist") {
      player.queue.add(res.tracks);
      await message.reply(
        silentReply(addedPlaylistEmbed(res.tracks.length, res.playlist?.title || "Playlist"))
      );
    } else {
      player.queue.add(res.tracks[0]);
      await message.reply(silentReply(addedTrackEmbed(res.tracks[0])));
    }

    if (!player.playing) {
      await player.play();
    }
  },
};
