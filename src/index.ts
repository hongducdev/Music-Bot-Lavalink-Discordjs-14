import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client, GatewayIntentBits, Collection, Events, MessageFlags } from "discord.js";
import { config } from "./config.js";
import { createLavalink } from "./music/player.js";
import { loadCommands } from "./utils/command-loader.js";
import { EMBED_COLORS, embed } from "./utils/embed.js";
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

client.on("raw", (d) => client.lavalink.sendRawData(d));

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user?.tag}`);
  if (client.user) {
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
    const replyPayload = {
      flags: MessageFlags.Ephemeral as const,
      embeds: [embed("Có lỗi xảy ra khi chạy lệnh. Thử lại giúp mình nhé! 🛠️", EMBED_COLORS.error, "❌ Lỗi")],
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(replyPayload);
    } else {
      await interaction.reply(replyPayload);
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
    await message.reply({
      embeds: [embed("Có lỗi xảy ra khi chạy lệnh. Thử lại giúp mình nhé! 🛠️", EMBED_COLORS.error, "❌ Lỗi")],
    });
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason instanceof Error ? reason.message : reason);
});

client.login(config.discordToken);
