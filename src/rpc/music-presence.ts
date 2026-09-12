import type { LavalinkManager, Player } from "lavalink-client";
import type { RequesterRpc } from "./requester-rpc.js";
import type { Client } from "discord.js";

type Song = { title: string; author?: string; uri?: string; duration?: number; isStream?: boolean };

export function songActivity(song: Song, position: number, paused: boolean, applicationId: string,
  name: string, now = Date.now()): Record<string, unknown> {
  const elapsed = Number.isFinite(position) ? Math.max(0, position) : 0;
  const duration = Number.isFinite(song.duration) && song.duration! > 0 ? song.duration! : undefined;
  const url = song.uri && URL.canParse(song.uri) ? new URL(song.uri) : undefined;
  const link = url && ["https:", "http:"].includes(url.protocol) ? url.toString() : undefined;
  return {
    name, type: 2, application_id: applicationId,
    details: (song.title || "Không rõ").slice(0, 128),
    state: `${paused ? "⏸ Tạm dừng · " : ""}${song.author || "Không rõ"}`.slice(0, 128),
    ...(!paused && !song.isStream ? { timestamps: {
      start: now - (duration ? Math.min(elapsed, duration) : elapsed),
      ...(duration ? { end: now + Math.max(0, duration - elapsed) } : {}),
    } } : {}),
    ...(link ? { buttons: ["Mở bài hát"], metadata: { button_urls: [link] } } : {}),
  };
}

type AnyTrack = { info: Song; requester?: unknown };
type Playback = Pick<Player, "guildId" | "voiceChannelId" | "position" | "paused">;

/**
 * One song per guild, shown to everyone listening in the bot's voice channel,
 * plus the requester wherever they are. A newer song in another guild replaces it.
 */
export class MusicPresence {
  private current = new Map<string, { player: Playback; track: AnyTrack }>();
  private shown = new Map<string, { player: Playback; track: AnyTrack }>();

  /** @param voiceMembers connected RPC users sitting in the bot's voice channel */
  constructor(private voiceMembers: (player: Playback) => string[] = () => []) {}

  /** New song (or a null track to clear) — returns every id whose presence must be refreshed. */
  start(player: Playback, track: AnyTrack | null): string[] {
    const refreshed = this.clear(player.guildId);
    if (track) refreshed.push(...this.select(player, track));
    return [...new Set(refreshed)];
  }

  /** Same song with a recomputed audience, for joins/leaves/pause/resume. */
  sync(player: Playback): string[] {
    const current = this.current.get(player.guildId);
    return current ? this.start(player, current.track) : [];
  }

  /** A user just linked RPC: show the guild's song when they sit with the bot. */
  join(userId: string, guildId: string | null | undefined): string[] {
    const current = guildId ? this.current.get(guildId) : undefined;
    if (current) this.shown.set(userId, current);
    else this.shown.delete(userId);
    return [userId];
  }

  /** `track` ignores late end events for a song the guild already replaced. */
  clear(guildId: string, track?: AnyTrack | null): string[] {
    const current = this.current.get(guildId);
    if (!current || (track && current.track !== track)) return [];
    this.current.delete(guildId);
    const refreshed = this.users(guildId);
    for (const id of refreshed) this.shown.delete(id);
    return refreshed;
  }

  activity(userId: string, applicationId: string, name: string): Record<string, unknown> | null {
    const shown = this.shown.get(userId);
    if (!shown) return null;
    return songActivity(shown.track.info, shown.player.position, shown.player.paused, applicationId, name);
  }

  private select(player: Playback, track: AnyTrack): string[] {
    this.current.set(player.guildId, { player, track });
    const ids = new Set(this.voiceMembers(player));
    const requester = (track.requester as { id?: string } | undefined)?.id;
    if (typeof requester === "string" && requester) ids.add(requester);
    for (const id of ids) this.shown.set(id, { player, track });
    return [...ids];
  }

  private users(guildId: string): string[] {
    return [...this.shown].filter(([, value]) => value.player.guildId === guildId).map(([id]) => id);
  }
}

export function voiceAudience(client: Client, rpc: RequesterRpc) {
  return (player: Playback): string[] => {
    const guild = client.guilds.cache.get(player.guildId);
    if (!guild || !player.voiceChannelId) return [];
    // Voice states are cached without the GuildMembers intent; channel.members are not.
    return [...guild.voiceStates.cache.values()]
      .filter(state => state.channelId === player.voiceChannelId && !state.member?.user.bot)
      .map(state => state.id)
      .filter(id => rpc.connected(id));
  };
}

/** The bot's own name is only known after login, so resolve it on every update. */
export function bindMusicPresence(client: Client, rpc: RequesterRpc, applicationId: string): void {
  const manager = client.lavalink;
  const audience = voiceAudience(client, rpc);
  const presence = new MusicPresence(audience);
  const update = (id: string) =>
    rpc.setActivity(id, presence.activity(id, applicationId, client.user?.displayName || "Music Bot"));

  rpc.onConnected = (userId) => {
    const player = [...manager.players.values()].find(candidate => audience(candidate).includes(userId));
    presence.join(userId, player?.guildId).forEach(update);
  };
  // Rời/ vào kênh voice phải cập nhật ngay, không đợi sự kiện nhạc kế tiếp.
  client.on("voiceStateUpdate", (oldState, newState) => {
    if (oldState.channelId === newState.channelId) return;
    for (const channelId of new Set([oldState.channelId, newState.channelId])) {
      if (!channelId) continue;
      const player = [...manager.players.values()].find(candidate => candidate.voiceChannelId === channelId);
      if (player) presence.sync(player).forEach(update);
    }
  });
  manager.on("trackStart", (player, track) => presence.start(player, track).forEach(update));
  manager.on("trackEnd", (player, track) => presence.clear(player.guildId, track).forEach(update));
  for (const event of ["playerPaused", "playerResumed"] as const) {
    manager.on(event, player => presence.sync(player).forEach(update));
  }
  for (const event of ["queueEnd", "playerDestroy", "playerDisconnect", "trackError", "trackStuck"] as const) {
    manager.on(event, (player: Player) => presence.clear(player.guildId).forEach(update));
  }
}
