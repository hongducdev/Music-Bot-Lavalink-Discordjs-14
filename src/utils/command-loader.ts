import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Collection } from "discord.js";
import type { Command } from "../types/command.js";

export async function loadCommands(baseDir: string): Promise<{
  commands: Collection<string, Command>;
  aliases: Collection<string, Command>;
}> {
  const commands = new Collection<string, Command>();
  const aliases = new Collection<string, Command>();
  const categories = readdirSync(baseDir, { withFileTypes: true });

  for (const category of categories) {
    if (!category.isDirectory()) continue;
    const categoryPath = join(baseDir, category.name);
    const files = readdirSync(categoryPath).filter(
      (file) => file.endsWith(".ts") || file.endsWith(".js")
    );

    for (const file of files) {
      const fullPath = join(categoryPath, file);
      const imported = await import(pathToFileURL(fullPath).href);
      const command: Command = imported.command || imported.default;

      if (command?.data?.name && typeof command.execute === "function") {
        // Gan ten thu muc lam category: lenh moi chi can tao file la /help tu hien.
        command.category = category.name;
        commands.set(command.data.name, command);
        for (const alias of command.aliases ?? []) {
          const taken = aliases.get(alias);
          if (taken) {
            console.warn(
              `[commands] Alias "${alias}" bi trung: "${command.data.name}" ghi de "${taken.data.name}". Hay bo alias o mot trong hai lenh.`
            );
          }
          aliases.set(alias, command);
        }
      }
    }
  }

  return { commands, aliases };
}
