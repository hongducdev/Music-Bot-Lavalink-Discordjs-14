import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import { config } from "./config.js";
import { createLavalink } from "./music/player.js";
import { loadCommands } from "./utils/command-loader.js";
import { startStatusRotation } from "./status.js";
import { readRpcOptions, RequesterRpc } from "./rpc/requester-rpc.js";
import { bindMusicPresence } from "./rpc/music-presence.js";
import {
  DELETE_AFTER,
  EMBED_COLORS,
  deleteAfter,
  embed,
  privateReply,
  privateReplyAndCleanup,
  setEmbedIcon,
  silentReply,
  silentReplyAndCleanup,
} from "./utils/embed.js";
import type { Command } from "./types/command.js";
import { buildBotInfoEmbed, shouldShowBotInfo, stripBotMention } from "./bot-info.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.lavalink = createLavalink(client);

try {
  const rpcOptions = readRpcOptions(config.clientId);
  if (rpcOptions) {
    const rpc = new RequesterRpc(rpcOptions);
    await rpc.start();
    client.requesterRpc = rpc;
    bindMusicPresence(client, rpc, config.clientId);
    console.log("[rpc] OAuth callback ready.");
  }
} catch {
  console.error("[rpc] Không bật được RPC; kiểm tra RPC_REDIRECT_URI, RPC_HOST và RPC_PORT.");
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    client.requesterRpc?.close();
    client.destroy();
    process.exit(0);
  });
}

const { commands, aliases } = await loadCommands(join(__dirname, "commands"));

// Nap registry len client de /help tu liet ke moi lenh, ke ca lenh them sau nay.
client.commands = commands;
client.aliases = aliases;

client.on("raw", (d) => client.lavalink.sendRawData(d));

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user?.tag}`);
  if (client.user) {
    setEmbedIcon(client.user.displayAvatarURL());
    startStatusRotation(client, config.prefix);
    client.lavalink.init({ ...client.user });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    const errorEmbed = () =>
      embed("🚫 | Có lỗi xảy ra khi chạy lệnh. Thử lại giúp mình nhé!", EMBED_COLORS.error, "Lỗi");

    if (interaction.replied || interaction.deferred) {
      const sent = await interaction.followUp(privateReply(errorEmbed()));
      deleteAfter(() => interaction.deleteReply(sent.id), DELETE_AFTER.error);
    } else {
      await privateReplyAndCleanup(interaction, errorEmbed());
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  const sendBotInfo = async (): Promise<void> => {
    if (!client.user) return;
    try {
      await message.reply(silentReply(buildBotInfoEmbed(client, config.prefix, commands.size)));
    } catch (error) {
      console.error("[bot-info] Không trả lời được mention:", error);
    }
  };

  // Hai cach go lenh: `!play x` hoac `@Bot play x`.
  const mentioned = client.user ? stripBotMention(message.content, client.user.id) : null;
  const viaMention = mentioned !== null;
  const body = viaMention
    ? mentioned
    : message.content.startsWith(config.prefix)
      ? message.content.slice(config.prefix.length).trim()
      : null;
  if (body === null) {
    // Ping bot giua cau (khong nam dau tin nhan) van duoc gioi thieu bot.
    if (client.user && shouldShowBotInfo(message.mentions, client.user.id)) await sendBotInfo();
    return;
  }

  // Ping kem @everyone/@here hoac role thi bot im lang (xem shouldShowBotInfo).
  if (viaMention && !shouldShowBotInfo(message.mentions, client.user!.id)) return;

  const args = body.split(/\s+/).filter(Boolean);
  const commandName = args.shift()?.toLowerCase();
  const command = commandName ? commands.get(commandName) || aliases.get(commandName) : undefined;

  // Ping tron hoac lenh khong ton tai: gioi thieu bot thay vi im lang.
  if (!command?.executeMessage) {
    if (viaMention) await sendBotInfo();
    return;
  }

  try {
    await command.executeMessage(message, args);
  } catch (error) {
    console.error(`Error executing message command ${commandName}:`, error);
    await silentReplyAndCleanup(
      message,
      embed("🚫 | Có lỗi xảy ra khi chạy lệnh. Thử lại giúp mình nhé!", EMBED_COLORS.error, "Lỗi")
    );
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason instanceof Error ? reason.message : reason);
});

client.login(config.discordToken).catch(() => {
  client.requesterRpc?.close();
  console.error("[bot] Đăng nhập Discord thất bại.");
  process.exit(1);
});
