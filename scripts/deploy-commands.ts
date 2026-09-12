import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PermissionsBitField, REST, Routes } from "discord.js";
import { config } from "../src/config.js";
import { loadCommands } from "../src/utils/command-loader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commandsPath = join(__dirname, "../src/commands");
const { commands } = await loadCommands(commandsPath);
const payload = Array.from(commands.values()).map((cmd) => cmd.data.toJSON());

const rest = new REST().setToken(config.discordToken);
const guildId = process.env.GUILD_ID;
const route = guildId
  ? Routes.applicationGuildCommands(config.clientId, guildId)
  : Routes.applicationCommands(config.clientId);

const scope = guildId ? `server ${guildId} (cập nhật ngay)` : "toàn bộ bot (chờ tối đa 1 giờ)";

try {
  console.log(`⏳ Đang deploy ${payload.length} lệnh tới ${scope}...`);
  await rest.put(route, { body: payload });
  console.log(`✅ Deploy thành công ${payload.length} lệnh.`);
} catch (error) {
  console.error("❌ Deploy thất bại:", error);
  process.exit(1);
}

const permissions = new PermissionsBitField([
  PermissionsBitField.Flags.ViewChannel,
  PermissionsBitField.Flags.SendMessages,
  PermissionsBitField.Flags.EmbedLinks,
  PermissionsBitField.Flags.Connect,
  PermissionsBitField.Flags.Speak,
]);

const inviteUrl =
  `https://discord.com/oauth2/authorize?client_id=${config.clientId}` +
  `&permissions=${permissions.bitfield}&scope=bot%20applications.commands`;

console.log(`\n🔗 Link mời bot (kèm đủ quyền cần thiết):\n${inviteUrl}`);
