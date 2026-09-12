import { SlashCommandBuilder, MessageFlags, type GuildMember } from "discord.js";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, embed } from "../../utils/embed.js";
import {
  REQUIRED_TEXT_PERMISSIONS,
  REQUIRED_VOICE_PERMISSIONS,
  missingChannelPermissions,
} from "../../utils/permissions.js";

function missingPermissionEmbed(scope: string, names: string[]) {
  return embed(
    `Mình thiếu quyền sau ở ${scope}:\n${names.map((name) => `• ${name}`).join("\n")}`,
    EMBED_COLORS.error,
    "🚫 Thiếu quyền"
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
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed("Bạn cần vào một kênh thoại trước đã! 🔊", EMBED_COLORS.error, "Chưa vào voice")],
      });
      return;
    }

    const query = interaction.options.getString("query");
    if (!query) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed("Vui lòng nhập tên bài hát hoặc link nhé! ✍️", EMBED_COLORS.error)],
      });
      return;
    }

    const botMember = interaction.guild?.members.me;
    const missingVoice = missingChannelPermissions(
      REQUIRED_VOICE_PERMISSIONS,
      voiceChannel,
      botMember
    );
    if (missingVoice.length) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [missingPermissionEmbed(`kênh thoại **${voiceChannel.name}**`, missingVoice)],
      });
      return;
    }

    const textChannel = interaction.channel;
    const missingText =
      textChannel && "permissionsFor" in textChannel
        ? missingChannelPermissions(REQUIRED_TEXT_PERMISSIONS, textChannel, botMember)
        : [];
    if (missingText.length) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [missingPermissionEmbed("kênh chat này", missingText)],
      });
      return;
    }

    await interaction.deferReply();

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
        embeds: [embed(`Không tìm thấy bài nào cho **${query}** 😕`, EMBED_COLORS.error, "Không có kết quả")],
      });
      return;
    }

    if (res.loadType === "playlist") {
      player.queue.add(res.tracks);
      await interaction.editReply({
        embeds: [
          embed(
            `Đã thêm **${res.tracks.length}** bài vào hàng đợi 📥`,
            EMBED_COLORS.success,
            `📚 ${res.playlist?.title || "Playlist"}`
          ),
        ],
      });
    } else {
      player.queue.add(res.tracks[0]);
      await interaction.editReply({
        embeds: [
          embed(
            `**${res.tracks[0].info.title}**\n${res.tracks[0].info.author ?? ""}`,
            EMBED_COLORS.success,
            "✅ Đã thêm vào hàng đợi"
          ).setThumbnail(res.tracks[0].info.artworkUrl || null),
        ],
      });
    }

    if (!player.playing) {
      await player.play();
    }
  },
  async executeMessage(message, args) {
    const voiceChannel = message.member?.voice.channel;

    if (!voiceChannel) {
      await message.reply({
        embeds: [embed("Bạn cần vào một kênh thoại trước đã! 🔊", EMBED_COLORS.error, "Chưa vào voice")],
      });
      return;
    }

    const query = args.join(" ").trim();
    if (!query) {
      await message.reply({
        embeds: [
          embed("Vui lòng nhập tên bài hát hoặc link! Ví dụ: `!play faded` ✍️", EMBED_COLORS.error),
        ],
      });
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
      await message.reply({
        embeds: [
          missingVoice.length
            ? missingPermissionEmbed(`kênh thoại **${voiceChannel.name}**`, missingVoice)
            : missingPermissionEmbed("kênh chat này", missingText),
        ],
      });
      return;
    }

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
      await message.reply({
        embeds: [embed(`Không tìm thấy bài nào cho **${query}** 😕`, EMBED_COLORS.error, "Không có kết quả")],
      });
      return;
    }

    if (res.loadType === "playlist") {
      player.queue.add(res.tracks);
      await message.reply({
        embeds: [
          embed(
            `Đã thêm **${res.tracks.length}** bài vào hàng đợi 📥`,
            EMBED_COLORS.success,
            `📚 ${res.playlist?.title || "Playlist"}`
          ),
        ],
      });
    } else {
      player.queue.add(res.tracks[0]);
      await message.reply({
        embeds: [
          embed(
            `**${res.tracks[0].info.title}**\n${res.tracks[0].info.author ?? ""}`,
            EMBED_COLORS.success,
            "✅ Đã thêm vào hàng đợi"
          ).setThumbnail(res.tracks[0].info.artworkUrl || null),
        ],
      });
    }

    if (!player.playing) {
      await player.play();
    }
  },
};
