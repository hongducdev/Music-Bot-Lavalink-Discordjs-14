import type {
  ChatInputCommandInteraction,
  Message,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export interface Command {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder;
  aliases?: string[];
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  executeMessage?: (message: Message, args: string[]) => Promise<void>;
}
