import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import { EMBED_COLORS, embed, silentReply } from "../../utils/embed.js";
import { isAutoplayEnabled, setAutoplay } from "../../music/autoplay.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("autoplay")
    .setDescription("Bật/tắt tự phát bài liên quan khi hết hàng đợi (mặc định: bật)")
    .addBooleanOption((option) =>
      option.setName("bat").setDescription("Bật (true) hoặc tắt (false)").setRequired(true)
    ),
  aliases: ["ap"],
  async execute(interaction) {
    const enabled = interaction.options.getBoolean("bat", true);
    setAutoplay(interaction.guildId!, enabled);

    await interaction.reply(
      silentReply(
        embed(
          enabled
            ? "🔁 Đã bật autoplay: hết hàng đợi mình sẽ tự tìm bài liên quan."
            : "⏹️ Đã tắt autoplay: hết hàng đợi mình sẽ dừng.",
          EMBED_COLORS.default,
          "Tự động phát"
        )
      )
    );
  },
  async executeMessage(message, args) {
    const value = args[0]?.toLowerCase();
    if (value !== "on" && value !== "off") {
      await message.reply(
        silentReply(
          embed(
            `⚙️ Autoplay đang **${isAutoplayEnabled(message.guildId!) ? "BẬT" : "TẮT"}**.\nDùng \`!autoplay on\` hoặc \`!autoplay off\`.`,
            EMBED_COLORS.default,
            "Tự động phát"
          )
        )
      );
      return;
    }

    const enabled = value === "on";
    setAutoplay(message.guildId!, enabled);
    await message.reply(
      silentReply(
        embed(
          enabled
            ? "🔁 Đã bật autoplay: hết hàng đợi sẽ tự phát bài liên quan."
            : "⏹️ Đã tắt autoplay.",
          EMBED_COLORS.default,
          "Tự động phát"
        )
      )
    );
  },
};
