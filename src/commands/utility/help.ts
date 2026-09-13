import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import { config } from "../../config.js";
import {
  EMBED_COLORS,
  embed,
  privateReply,
  silentReply,
  type MessageContainerBuilder,
} from "../../utils/embed.js";

const CATEGORY_ICONS: Record<string, string> = {
  music: "🎵",
  utility: "🛠️",
};

function categoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? "📁";
}

export function overviewEmbed(commands: Command[]): MessageContainerBuilder {
  const grouped = new Map<string, Command[]>();
  for (const command of commands) {
    const category = command.category ?? "khác";
    grouped.set(category, [...(grouped.get(category) ?? []), command]);
  }

  const builder = embed(
    `Bắt đầu với \`/play <tên bài hoặc link>\`.\n**${commands.length}** lệnh · dùng được cả slash và prefix.`,
    EMBED_COLORS.default,
    "Trợ giúp"
  );

  for (const [category, list] of grouped) {
    builder.addFields({
      name: `${categoryIcon(category)} ${category === "music" ? "Nghe nhạc" : category === "utility" ? "Tiện ích" : category} · ${list.length}`,
      value: list.map((item) => `\`/${item.data.name}\` — ${item.data.description}`).join("\n"),
    });
  }

  builder.setFooter({
    text: `Xem chi tiết: /help <lệnh> hoặc ${config.prefix}help <lệnh>`,
  });
  return builder;
}

export function detailEmbed(command: Command): MessageContainerBuilder {
  const prefixUsage = command.executeMessage
    ? `\`${config.prefix}${command.data.name}\``
    : "không hỗ trợ";
  const aliases =
    command.aliases?.map((alias) => `\`${config.prefix}${alias}\``).join(", ") || "không có";

  return embed(
    command.data.description || "Hướng dẫn sử dụng lệnh",
    EMBED_COLORS.default,
    `Lệnh /${command.data.name}`
  ).addFields(
    { name: "Slash", value: `\`/${command.data.name}\``, inline: true },
    { name: "Prefix", value: prefixUsage, inline: true },
    { name: "Viết tắt", value: aliases, inline: false }
  );
}

function findCommand(commands: Command[], query: string): Command | undefined {
  const needle = query.toLowerCase();
  return commands.find(
    (command) => command.data.name === needle || (command.aliases ?? []).includes(needle)
  );
}

function notFoundEmbed(query: string): MessageContainerBuilder {
  return embed(`🚫 Không tìm thấy lệnh **${query}**.`, EMBED_COLORS.error, "Trợ giúp");
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
