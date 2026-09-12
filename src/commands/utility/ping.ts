import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, embed } from "../../utils/embed.js";

function latencyEmbed(ping: number) {
  const icon = ping < 100 ? "🟢" : ping < 200 ? "🟡" : "🔴";
  return embed(`${icon} Độ trễ websocket: **${ping}ms**`, EMBED_COLORS.info, "🏓 Pong!");
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Kiểm tra độ trễ của bot"),
  aliases: ["p"],
  async execute(interaction) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [latencyEmbed(interaction.client.ws.ping)],
    });
  },
  async executeMessage(message) {
    await message.reply({ embeds: [latencyEmbed(message.client.ws.ping)] });
  },
};
