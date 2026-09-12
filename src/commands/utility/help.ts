import { SlashCommandBuilder, type EmbedBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import { config } from "../../config.js";
import { EMBED_COLORS, embed, privateReply, silentReply } from "../../utils/embed.js";

const CATEGORY_ICONS: Record<string, string> = {
  music: "🎵",
  utility: "🛠️",
};

function categoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? "📁";
}

function overviewEmbed(commands: Command[]): EmbedBuilder {
  const grouped = new Map<string, Command[]>();
  for (const command of commands) {
    const category = command.category ?? "khác";
    grouped.set(category, [...(grouped.get(category) ?? []), command]);
  }

  const builder = embed(
    `📖 | Bot có **${commands.length}** lệnh, dùng được cả slash và prefix.`,
    EMBED_COLORS.default,
    "Help"
  );

  for (const [category, list] of grouped) {
    builder.addFields({
      name: `> ${categoryIcon(category)} ${category} [${list.length}]`,
      value: list.map((item) => `\`${item.data.name}\``).join(" "),
    });
  }

  builder.setFooter({
    text: `Xem chi tiết: /help <lệnh> hoặc ${config.prefix}help <lệnh>`,
  });
  return builder;
}

function detailEmbed(command: Command): EmbedBuilder {
  const prefixUsage = command.executeMessage
    ? `\`${config.prefix}${command.data.name}\``
    : "không hỗ trợ";
  const aliases =
    command.aliases?.map((alias) => `\`${config.prefix}${alias}\``).join(", ") || "không có";

  return embed(
    `📖 | Chi tiết lệnh **${command.data.name}**`,
    EMBED_COLORS.default,
    "Help"
  ).addFields(
    { name: "> Mô tả", value: command.data.description || "không có", inline: false },
    { name: "> Danh mục", value: command.category ?? "khác", inline: true },
    { name: "> Slash", value: `\`/${command.data.name}\``, inline: true },
    { name: "> Prefix", value: prefixUsage, inline: true },
    { name: "> Viết tắt", value: aliases, inline: false }
  );
}

function findCommand(commands: Command[], query: string): Command | undefined {
  const needle = query.toLowerCase();
  return commands.find(
    (command) => command.data.name === needle || (command.aliases ?? []).includes(needle)
  );
}

function notFoundEmbed(query: string): EmbedBuilder {
  return embed(`🚫 | Không tìm thấy lệnh **${query}**.`, EMBED_COLORS.error, "Help");
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Xem danh sách lệnh và cách dùng")
    .addStringOption((option) =>
      option.setName("lenh").setDescription("Tên lệnh cần xem chi tiết").setRequired(false)
    ),
  aliases: ["h"],
  async execute(interaction) {
    const commands = [...interaction.client.commands.values()];
    const query = interaction.options.getString("lenh")?.trim().replace(config.prefix, "");

    if (!query) {
      await interaction.reply(privateReply(overviewEmbed(commands)));
      return;
    }

    const found = findCommand(commands, query);
    await interaction.reply(privateReply(found ? detailEmbed(found) : notFoundEmbed(query)));
  },
  async executeMessage(message, args) {
    const commands = [...message.client.commands.values()];
    const query = args[0]?.trim().replace(config.prefix, "");

    if (!query) {
      await message.reply(silentReply(overviewEmbed(commands)));
      return;
    }

    const found = findCommand(commands, query);
    await message.reply(silentReply(found ? detailEmbed(found) : notFoundEmbed(query)));
  },
};
