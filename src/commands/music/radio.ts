import {
  SlashCommandBuilder,
  MessageFlags,
  type GuildMember,
  type RepliableInteraction,
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
  clearActiveRadio,
  getActiveRadio,
  tagRadioTrack,
  type RadioStation,
} from "../../music/radio.js";

/**
 * Co IsComponentsV2 phai gui kem o chinh lan tao ra components: Discord bo qua
 * flag nay o buoc defer, nen editReply khong co flag se bi tu choi
 * ("Value of field type must be one of (1,)") du dai da doi xong.
 * Ephemeral gui lai de khong mat tinh rieng tu khi flags bi thay the.
 */
export const RADIO_REPLY_FLAGS = MessageFlags.Ephemeral | MessageFlags.IsComponentsV2;

export interface RadioResult {
  success: boolean;
  message: string;
}

/** Tra loi mot interaction da defer bang card V2 cua radio. */
export async function replyRadioResult(
  interaction: RepliableInteraction,
  res: RadioResult
): Promise<void> {
  const color = res.success ? EMBED_COLORS.default : EMBED_COLORS.error;
  await interaction.editReply({
    components: [embed(res.message, color, "Radio")],
    flags: RADIO_REPLY_FLAGS,
  });
  if (!res.success) deleteAfter(() => interaction.deleteReply(), DELETE_AFTER.error);
}

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

  // Replace directly: skip only stops the old track and waits for trackEnd.
  // An explicit clientTrack also replaces a paused/current track instead of replaying it.
  const previousTracks = [...player.queue.tracks];
  const previousCurrent = player.queue.current;
  const previousRepeat = player.repeatMode;
  const previousStation = getActiveRadio(guildId);
  try {
    await player.queue.splice(0, player.queue.tracks.length);
    await player.setRepeatMode("off");
    setActiveRadio(guildId, station);
    await player.play({ clientTrack: track, paused: false, position: 0 });
  } catch {
    clearActiveRadio(guildId);
    if (previousStation) setActiveRadio(guildId, previousStation);
    player.queue.current = previousCurrent;
    await player.queue.splice(0, player.queue.tracks.length, previousTracks);
    await player.setRepeatMode(previousRepeat);
    return { success: false, message: `🚫 Không chuyển được sang đài **${station.name}**. Thử lại sau nhé!` };
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
    await interaction.deferReply({ flags: RADIO_REPLY_FLAGS });

    const res = await playRadioStation(member, interaction.channel, station, interaction.client);
    await replyRadioResult(interaction, res);
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
