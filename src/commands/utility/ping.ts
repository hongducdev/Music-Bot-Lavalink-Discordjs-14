import { SlashCommandBuilder } from "discord.js";
import { performance } from "node:perf_hooks";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, NO_PING, embed, privateReply, silentReply } from "../../utils/embed.js";
import { formatDuration } from "../../utils/text.js";

function latencyEmbed(ping: number, roundTrip: number, avatar: string | null) {
  const builder = embed("🏓 Pong!", EMBED_COLORS.default, "Ping")
    .addFields(
      { name: "Gateway heartbeat", value: Number.isFinite(ping) && ping >= 0 ? `${Math.round(ping)} ms` : "Chưa có dữ liệu", inline: true },
      { name: "HTTP phản hồi", value: `${Math.round(roundTrip)} ms`, inline: true },
      { name: "Uptime", value: formatDuration(process.uptime() * 1000), inline: true }
    )
    .setFooter({ text: "HTTP: gửi → nhận phản hồi, gồm thời gian xử lý/chờ API. Không phải ping mạng của bạn." });

  if (avatar) builder.setThumbnail(avatar, "Ảnh đại diện của bot");
  return builder;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Kiểm tra độ trễ của bot"),
  async execute(interaction) {
    const pending = privateReply(embed("Đang đo thời gian phản hồi…", EMBED_COLORS.default, "Ping"));
    // One local monotonic clock: Discord timestamps and system-clock adjustments cannot skew RTT.
    const start = performance.now();
    await interaction.reply(pending);
    const elapsed = performance.now() - start;
    await interaction.editReply({
      components: [latencyEmbed(interaction.client.ws.ping, elapsed, interaction.client.user?.displayAvatarURL() ?? null)],
      allowedMentions: NO_PING,
    });
  },
  async executeMessage(message) {
    const pending = silentReply(embed("Đang đo thời gian phản hồi…", EMBED_COLORS.default, "Ping"));
    const start = performance.now();
    const sent = await message.reply(pending);
    const elapsed = performance.now() - start;
    await sent.edit({
      components: [latencyEmbed(message.client.ws.ping, elapsed, message.client.user?.displayAvatarURL() ?? null)],
      allowedMentions: NO_PING,
    });
  },
};
