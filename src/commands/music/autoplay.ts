import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, embed } from "../../utils/embed.js";
import { isAutoplayEnabled, setAutoplay } from "../../music/autoplay.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("autoplay")
    .setDescription("Bật/tắt tự động phát bài liên quan khi hết hàng đợi")
    .addBooleanOption((option) =>
      option.setName("bat").setDescription("Bật (true) hoặc tắt (false)").setRequired(true)
    ),
  aliases: ["ap"],
  async execute(interaction) {
    const enabled = interaction.options.getBoolean("bat", true);
    setAutoplay(interaction.guildId!, enabled);

    await interaction.reply({
      embeds: [
        embed(
          enabled
            ? "Bật autoplay: khi hết hàng đợi mình sẽ tự tìm bài liên quan. 🔁"
            : "Đã tắt autoplay. Khi hết hàng đợi mình sẽ dừng. ⏹️",
          enabled ? EMBED_COLORS.success : EMBED_COLORS.warning,
          enabled ? "🔁 Autoplay: BẬT" : "⏹️ Autoplay: TẮT"
        ),
      ],
    });
  },
  async executeMessage(message, args) {
    const value = args[0]?.toLowerCase();
    if (value !== "on" && value !== "off") {
      await message.reply({
        embeds: [
          embed(
            `Autoplay đang **${isAutoplayEnabled(message.guildId!) ? "BẬT" : "TẮT"}**.\nDùng \`!autoplay on\` hoặc \`!autoplay off\` ⚙️`,
            EMBED_COLORS.info,
            "🔁 Autoplay"
          ),
        ],
      });
      return;
    }

    const enabled = value === "on";
    setAutoplay(message.guildId!, enabled);
    await message.reply({
      embeds: [
        embed(
          enabled ? "Bật autoplay: hết hàng đợi sẽ tự phát bài liên quan. 🔁" : "Đã tắt autoplay. ⏹️",
          enabled ? EMBED_COLORS.success : EMBED_COLORS.warning,
          enabled ? "🔁 Autoplay: BẬT" : "⏹️ Autoplay: TẮT"
        ),
      ],
    });
  },
};
