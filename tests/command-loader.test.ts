import { describe, it, expect, vi, afterEach } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCommands } from "../src/utils/command-loader.js";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const tempDirs: string[] = [];

/** Thu muc tam nam trong project de file .js duoc coi la ESM (package.json type: module). */
function fixtureRoot(): string {
  const root = mkdtempSync(join(projectRoot, "tests", ".tmp-loader-"));
  tempDirs.push(root);
  return root;
}

function writeCommand(root: string, relativePath: string, body: string): void {
  const fullPath = join(root, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, body);
}

function commandSource(name: string, aliases: string[] = []): string {
  return `export const command = {
  data: { name: "${name}" },
  aliases: ${JSON.stringify(aliases)},
  execute: async () => {},
};`;
}

afterEach(() => {
  vi.restoreAllMocks();
  while (tempDirs.length) rmSync(tempDirs.pop()!, { recursive: true, force: true });
});

describe("loadCommands", () => {
  it("tags each command with its folder name so /help can group them", async () => {
    const root = fixtureRoot();
    writeCommand(root, "music/fake.js", commandSource("fake"));

    const { commands } = await loadCommands(root);

    expect(commands.size).toBe(1);
    expect(commands.get("fake")?.category).toBe("music");
  });

  it("registers aliases and warns when two commands claim the same one", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const root = fixtureRoot();
    writeCommand(root, "music/one.js", commandSource("one", ["x"]));
    writeCommand(root, "utility/two.js", commandSource("two", ["x"]));

    const { commands, aliases } = await loadCommands(root);

    expect(commands.size).toBe(2);
    expect(["one", "two"]).toContain(aliases.get("x")?.data.name);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Alias "x" bi trung'));
  });

  it("keeps the registry free of duplicate aliases in the real command tree", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { commands, aliases } = await loadCommands(join(projectRoot, "src", "commands"));

    expect(warn).not.toHaveBeenCalled();
    for (const alias of aliases.keys()) {
      expect(commands.get(alias)).toBeUndefined();
    }
    expect(aliases.get("p")?.data.name).toBe("play");
  });
});
