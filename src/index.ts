import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import { config } from "./config.js";
import { createLavalink } from "./music/player.js";
import { loadCommands } from "./utils/command-loader.js";
import { startStatusRotation } from "./status.js";
import {
  DELETE_AFTER,
  EMBED_COLORS,
  deleteAfter,
  embed,
  privateReply,
  privateReplyAndCleanup,
  setEmbedIcon,
  silentReplyAndCleanup,
} from "./utils/embed.js";
import type { Command } from "./types/command.js";

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
  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = commands.get(commandName) || aliases.get(commandName);
  if (!command || !command.executeMessage) return;

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

client.login(config.discordToken);
