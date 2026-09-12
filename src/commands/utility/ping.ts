import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, embed, privateReply, silentReply } from "../../utils/embed.js";
import { formatDuration } from "../../utils/text.js";

function latencyEmbed(ping: number, roundTrip: number, avatar: string | null) {
  const builder = embed("🏓 | Pong!", EMBED_COLORS.default, "Ping")
    .addFields(
      { name: "> API Latency", value: `${ping}ms`, inline: true },
      { name: "> Discord Latency", value: `${roundTrip}ms`, inline: true },
      { name: "> Uptime", value: formatDuration(process.uptime() * 1000), inline: true }
    )
    .setTimestamp();

  if (avatar) builder.setThumbnail(avatar, "Ảnh đại diện của bot");
  return builder;
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Kiểm tra độ trễ của bot"),
  async execute(interaction) {
    await interaction.reply(
      privateReply(
        latencyEmbed(
          interaction.client.ws.ping,
          Date.now() - interaction.createdTimestamp,
          interaction.client.user?.displayAvatarURL() ?? null
        )
      )
    );
  },
  async executeMessage(message) {
    await message.reply(
      silentReply(
        latencyEmbed(
          message.client.ws.ping,
          Date.now() - message.createdTimestamp,
          message.client.user?.displayAvatarURL() ?? null
        )
      )
    );
  },
};
