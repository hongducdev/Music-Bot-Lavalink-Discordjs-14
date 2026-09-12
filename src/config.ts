import "dotenv/config";

export interface BotConfig {
  discordToken: string;
  clientId: string;
  prefix: string;
  lavalink: {
    host: string;
    port: number;
    authorization: string;
    secure: boolean;
  };
}

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config: BotConfig = {
  discordToken: requiredEnv("DISCORD_TOKEN"),
  clientId: requiredEnv("CLIENT_ID"),
  prefix: process.env.PREFIX || "!",
  lavalink: {
    host: process.env.LAVALINK_HOST || "localhost",
    port: Number(process.env.LAVALINK_PORT || "2333"),
    authorization: process.env.LAVALINK_PASSWORD || "youshallnotpass",
    secure: process.env.LAVALINK_SECURE === "true",
  },
};
