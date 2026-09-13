import {
  SlashCommandBuilder,
  MessageFlags,
  type GuildMember,
} from "discord.js";
import type { Command } from "../../types/command.js";
import {
  EMBED_COLORS,
  DELETE_AFTER,
  deleteAfter,
  embed,
  privateReplyAndCleanup,
  silentReply,
  silentReplyAndCleanup,
} from "../../utils/embed.js";
import {
  RADIO_STATIONS,
  findRadioStation,
  buildRadioEmbed,
  buildRadioSelectMenu,
  setActiveRadio,
  tagRadioTrack,
  type RadioStation,
} from "../../music/radio.js";

export async function playRadioStation(
  member: GuildMember,
  textChannel: any,
  station: RadioStation,
  client: any
): Promise<{ success: boolean; message: string }> {
  const voiceChannel = member.voice?.channel;
  if (!voiceChannel) {
    return { success: false, message: "🚫 Bạn cần vào một kênh thoại trước đã!" };
  }

  const guildId = voiceChannel.guild?.id ?? (voiceChannel as any).guildId;
  const player =
    client.lavalink.getPlayer(guildId) ||
    client.lavalink.createPlayer({
      guildId,
      voiceChannelId: voiceChannel.id,
      textChannelId: textChannel?.id,
      selfDeaf: true,
    });

  if (!player.connected) {
    await player.connect();
  }

  const res = await player.search({ query: station.query }, member.user);
  if (!res.tracks.length) {
    return {
      success: false,
      message: `🚫 Hiện tại không thể kết nối tới đài **${station.name}**. Thử lại sau nhé!`,
    };
  }

  // Xoa danh sach bai cu de nhuong cho cho dai phat thanh 24/7
  const track = res.tracks[0];
  // Stream HLS/radio khong co metadata -> Lavalink tra "Unknown title".
  // Gan ten dai vao chinh track de moi card (now playing, /np, /queue) hien dung.
  // ponytail: sua hien thi, khong dung cho logic; bo neu Lavalink tu tra metadata.
  tagRadioTrack(track, station);

  player.queue.tracks.length = 0;
  player.queue.add(track, 0);

  // Ghi nho dai dang phat de tu phat lai neu luong bi dut (xem handleQueueEnd).
  setActiveRadio(guildId, station);

  if (player.playing) {
    await player.skip(0, false);
  } else {
    await player.play();
  }

  return {
    success: true,
    message: `${station.emoji} | Đang phát đài 24/7:\n> **${station.name}**\n> *${station.description}*`,
  };
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("radio")
    .setDescription("Phát đài trực tuyến 24/7 (Lofi, Chillhop, VOV...)")
    .addStringOption((option) =>
      option
        .setName("station")
        .setDescription("Chọn kênh phát thanh 24/7")
        .setRequired(false)
        .addChoices(
          ...Object.values(RADIO_STATIONS).map((s) => ({
            name: `${s.emoji} ${s.name}`,
            value: s.id,
          }))
        )
    ),
  aliases: ["rd"],
  async execute(interaction) {
    const stationId = interaction.options.getString("station");
    if (!stationId) {
      await interaction.reply({
        components: [buildRadioEmbed().addActionRows(buildRadioSelectMenu())],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
      });
      return;
    }

    const station = findRadioStation(stationId);
    if (!station) {
      await privateReplyAndCleanup(
        interaction,
        embed("⚠️ Không tìm thấy kênh đài này.", EMBED_COLORS.error, "Radio")
      );
      return;
    }

    const member = interaction.member as GuildMember | null;
    if (!member?.voice?.channel) {
      await privateReplyAndCleanup(
        interaction,
        embed("🚫 Bạn cần vào một kênh thoại trước đã!", EMBED_COLORS.error, "Radio")
      );
      return;
    }

    // Tim stream co the lau hon 3s -> phai defer truoc khi goi mang.
    await interaction.deferReply({ flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });

    const res = await playRadioStation(member, interaction.channel, station, interaction.client);
    if (!res.success) {
      await interaction.editReply({
        components: [embed(res.message, EMBED_COLORS.error, "Radio")],
      });
      deleteAfter(() => interaction.deleteReply(), DELETE_AFTER.error);
      return;
    }

    await interaction.editReply({ components: [embed(res.message, EMBED_COLORS.default, "Radio")] });
  },
  async executeMessage(message, args) {
    const query = args.join(" ").trim();
    if (!query) {
      await message.reply({
        components: [buildRadioEmbed().addActionRows(buildRadioSelectMenu())],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications,
      });
      return;
    }

    const station = findRadioStation(query);
    if (!station) {
      await silentReplyAndCleanup(
        message,
        embed(
          "⚠️ Không tìm thấy kênh đài này. Dùng `!radio` để xem danh sách các đài có sẵn.",
          EMBED_COLORS.error,
          "Radio"
        )
      );
      return;
    }

    const member = message.member as GuildMember | null;
    if (!member?.voice?.channel) {
      await silentReplyAndCleanup(
        message,
        embed("🚫 Bạn cần vào một kênh thoại trước đã!", EMBED_COLORS.error, "Radio")
      );
      return;
    }

    const res = await playRadioStation(member, message.channel, station, message.client);
    if (!res.success) {
      await silentReplyAndCleanup(message, embed(res.message, EMBED_COLORS.error, "Radio"));
      return;
    }

    await message.reply(silentReply(embed(res.message, EMBED_COLORS.default, "Radio")));
  },
};
