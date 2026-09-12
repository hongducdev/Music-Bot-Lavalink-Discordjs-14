import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type EmbedBuilder,
} from "discord.js";
import { EMBED_COLORS, embed } from "../utils/embed.js";

export const RADIO_SELECT_ID = "radio_select_station";

export interface RadioStation {
  id: string;
  name: string;
  query: string;
  description: string;
  emoji: string;
}

/**
 * Link ở đây là HLS (.m3u8) chính chủ của đài, KHÔNG kèm token hết hạn.
 *
 * ponytail: Lavalink `http` source nhận HLS (lavaplayer có HlsStreamTrack) nhưng
 * thực tế các luồng đài chết ngay sau khi kết nối voice — xem `handleQueueEnd`
 * trong src/music/player.ts để biết cơ chế tự phát lại. Đài không giữ được luồng
 * thì bot báo rõ, không im lặng báo "Hết nhạc".
 *
 * Đã loại bỏ:
 *   - VOH/HTV (vnns.net): JWT hết hạn 2030, luồng chết tức thì (kiểm chứng qua log Lavalink)
 *   - Thừa Thiên Huế TRT FM 93.0 : chứng chỉ TLS đã hết hạn
 *   - Đồng Tháp THĐT FM 98.4     : chứng chỉ TLS sai tên miền (SNI mismatch)
 *   - Vĩnh Long THVL FM 90.2     : tên miền bị chặn DNS, trỏ về 127.0.0.1
 */
export const RADIO_STATIONS: Record<string, RadioStation> = {
  lofi: {
    id: "lofi",
    name: "Lofi Girl - beats to relax/study",
    query: "https://www.youtube.com/watch?v=rFZHOHl-L8A",
    description: "Lofi hip hop để học bài / thư giãn",
    emoji: "☕",
  },
  sleep: {
    id: "sleep",
    name: "Lofi Girl - beats to sleep/chill",
    query: "https://www.youtube.com/watch?v=JD-kMIpDfnY",
    description: "Nhịp chậm, dễ ngủ / nghỉ ngơi",
    emoji: "🌙",
  },
  chill: {
    id: "chill",
    name: "Chillhop Radio 24/7",
    query: "https://www.youtube.com/watch?v=5yx6BWlEVcY",
    description: "Jazzy & lofi hip hop beats",
    emoji: "🍃",
  },
  vov1: {
    id: "vov1",
    name: "VOV1 - Thời Sự",
    query: "https://audio-lss.vov.vn/live/vov1.m3u8",
    description: "Tin tức, thời sự quốc gia 24/7",
    emoji: "🎙️",
  },
  vov2: {
    id: "vov2",
    name: "VOV2 - Văn hoá & Đời sống",
    query: "https://audio-lss.vov.vn/live/vov2.m3u8",
    description: "Văn hoá, giải trí và âm nhạc Việt Nam",
    emoji: "📻",
  },
  vov3: {
    id: "vov3",
    name: "VOV3 - Âm nhạc & Giải trí",
    query: "https://audio-lss.vov.vn/live/vov3.m3u8",
    description: "Âm nhạc hiện đại và giải trí cho giới trẻ",
    emoji: "🎵",
  },
  vov4: {
    id: "vov4",
    name: "VOV4 - Dân tộc",
    query: "https://audio-lss.vov.vn/live/vov4.m3u8",
    description: "Văn hoá các dân tộc Việt Nam",
    emoji: "🏔️",
  },
  vov5: {
    id: "vov5",
    name: "VOV5 - Đối ngoại",
    query: "https://audio-lss.vov.vn/live/vov5.m3u8",
    description: "Phát thanh quốc tế bằng nhiều ngôn ngữ",
    emoji: "🌏",
  },
  hanoi: {
    id: "hanoi",
    name: "Hà Nội HTV - FM 96 MHz",
    query: "https://cloudcdnfm90.tek4tv.vn/HANOI96/stream.m3u8",
    description: "Đài Hà Nội (khu vực Miền Bắc)",
    emoji: "🏙️",
  },
  danang: {
    id: "danang",
    name: "Đà Nẵng DRT - FM 98.5 MHz",
    query:
      "https://live.mediatech.vn/live/2858a998b1c7fbf4522accd5554588ceae3/playlist.m3u8",
    description: "Đài Đà Nẵng (khu vực Miền Trung)",
    emoji: "🌉",
  },
  quangninh: {
    id: "quangninh",
    name: "Quảng Ninh QNR1 - FM 97.8 MHz",
    query: "https://live.baoquangninh.vn/qtvlive/qnr1.m3u8",
    description: "Đài Quảng Ninh (khu vực Miền Bắc)",
    emoji: "⛰️",
  },
};

/**
 * Trang thai dai 24/7 dang phat cua tung guild (in-memory, khong dung DB).
 * Dung de biet co nen tu phat lai khi luong dai bi dut hay khong.
 */
const active = new Map<string, RadioStation>();
const startedAt = new Map<string, number>();
const failures = new Map<string, number>();

/** Mot lan phat dai duoc coi la "chay tot" neu song duoc qua moc nay. */
export const RADIO_HEALTHY_MS = 60_000;
/** So lan dut lien tiep toi da truoc khi bao loi thay vi thu lai. */
export const RADIO_MAX_RETRIES = 3;

export function setActiveRadio(guildId: string, station: RadioStation): void {
  active.set(guildId, station);
  failures.delete(guildId);
  startedAt.delete(guildId);
}

export function clearActiveRadio(guildId: string): void {
  active.delete(guildId);
  failures.delete(guildId);
  startedAt.delete(guildId);
}

export function getActiveRadio(guildId: string): RadioStation | undefined {
  return active.get(guildId);
}

/** Goi khi track dai bat dau phat, de do xem no song duoc bao lau. */
export function markRadioStarted(guildId: string): void {
  startedAt.set(guildId, Date.now());
}

export interface RadioEndDecision {
  /** Con nen thu phat lai dai nay khong. */
  retry: boolean;
  /** So lan dut lien tiep da dem duoc. */
  attempts: number;
}

/**
 * Quyet dinh khi hang doi het trong luc dang phat dai.
 * Song qua RADIO_HEALTHY_MS thi coi la lan chay moi; dut som thi tinh la loi va
 * chi thu lai toi da RADIO_MAX_RETRIES lan de khong lap vo han.
 */
export function decideRadioEnd(guildId: string, now: number = Date.now()): RadioEndDecision {
  const ranFor = now - (startedAt.get(guildId) ?? now);
  if (ranFor >= RADIO_HEALTHY_MS) {
    failures.delete(guildId);
    return { retry: true, attempts: 0 };
  }

  const attempts = (failures.get(guildId) ?? 0) + 1;
  failures.set(guildId, attempts);
  return { retry: attempts <= RADIO_MAX_RETRIES, attempts };
}

/** Gan ten dai vao track: luong radio khong co metadata that. */
export function tagRadioTrack(
  track: { info: { title?: string; author?: string | null } },
  station: RadioStation
): void {
  track.info.title = station.name;
  track.info.author = "Radio 24/7";
}

export function findRadioStation(input?: string | null): RadioStation | undefined {
  if (!input) return undefined;
  const key = input.trim().toLowerCase();
  if (RADIO_STATIONS[key]) return RADIO_STATIONS[key];

  return Object.values(RADIO_STATIONS).find(
    (station) => station.id.toLowerCase() === key || station.name.toLowerCase().includes(key)
  );
}

export function buildRadioEmbed(): EmbedBuilder {
  const list = Object.values(RADIO_STATIONS)
    .map((s) => `${s.emoji} **${s.name}** (\`${s.id}\`)\n> ${s.description}`)
    .join("\n\n");

  return embed(
    `Chọn một đài phát thanh 24/7 từ menu bên dưới hoặc dùng lệnh: \`/radio <tên_đài>\`\n\n${list}`,
    EMBED_COLORS.default,
    "Đài phát thanh 24/7"
  );
}

export function buildRadioSelectMenu(): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(RADIO_SELECT_ID)
    .setPlaceholder("Chọn kênh phát thanh 24/7...")
    .addOptions(
      Object.values(RADIO_STATIONS).map((s) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(s.name)
          .setValue(s.id)
          .setDescription(s.description)
          .setEmoji(s.emoji)
      )
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}
