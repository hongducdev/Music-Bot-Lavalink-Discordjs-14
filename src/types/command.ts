import type {
  ChatInputCommandInteraction,
  Collection,
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
  /** Ten thu muc chua file lenh, do command-loader gan tu dong. */
  category?: string;
  aliases?: string[];
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  executeMessage?: (message: Message, args: string[]) => Promise<void>;
}

declare module "discord.js" {
  interface Client {
    /** Registry do loadCommands nap vao, de /help tu liet ke moi lenh dang co. */
    commands: Collection<string, Command>;
    aliases: Collection<string, Command>;
  }
}
