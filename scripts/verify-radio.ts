/**
 * Kiem chung moi dai trong RADIO_STATIONS co that su phat duoc khong.
 *
 * Chay: npm run verify:radio   (can Lavalink dang chay)
 *
 * Day la luoi an toan cho loi tung ton tai: bo sot link chet (VOV cu dung
 * host khong ton tai) ma unit test khong the bat vi no chi kiem tra chuoi.
 */
import { RADIO_STATIONS } from "../src/music/radio.js";
import { config } from "../src/config.js";

const base = `${config.lavalink.secure ? "https" : "http"}://${config.lavalink.host}:${config.lavalink.port}`;

async function load(query: string): Promise<{ ok: boolean; detail: string; hls: boolean }> {
  const hls = await isHls(query);
  const res = await fetch(
    `${base}/v4/loadtracks?identifier=${encodeURIComponent(query)}`,
    { headers: { Authorization: config.lavalink.authorization } }
  );
  if (!res.ok) return { ok: false, detail: `HTTP ${res.status}`, hls };

  const body = (await res.json()) as {
    loadType: string;
    data?: { info?: { title?: string; author?: string; isStream?: boolean } };
  };
  if (body.loadType !== "track" || !body.data?.info) {
    return { ok: false, detail: `loadType=${body.loadType}`, hls };
  }
  const info = body.data.info;
  return {
    ok: true,
    detail: `stream=${info.isStream} "${info.title}" (${info.author})`,
    hls,
  };
}

/**
 * Kiem tra URL co phai playlist HLS khong.
 *
 * loadType=track KHONG chung minh phat duoc: Lavalink nhan URL roi tra ve mot
 * track bat ke noi dung la gi. Luong HLS (.m3u8) truoc day lot qua kiem tra nay
 * roi chet ngay sau khi ket noi voice, nen phai canh bao rieng.
 *
 * Luu y: CDN co the tra HTTP 200 kem body loi — phai doc body, dung tin status.
 */
async function isHls(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return false;
    const body = await res.text();
    return body.trimStart().startsWith("#EXTM3U");
  } catch {
    return false;
  }
}

let failed = 0;
let hlsCount = 0;
for (const station of Object.values(RADIO_STATIONS)) {
  try {
    const result = await load(station.query);
    if (result.hls) hlsCount++;
    const kind = result.hls ? "[HLS ]" : "[dir ]";
    console.log(
      `${result.ok ? "OK  " : "FAIL"} ${kind} ${station.id.padEnd(10)} ${result.detail}`
    );
    if (!result.ok) failed++;
  } catch (error) {
    console.log(`FAIL ${station.id.padEnd(10)} ${(error as Error).message}`);
    failed++;
  }
}

console.log(failed ? `\n${failed} dai KHONG load duoc.` : "\nTat ca dai deu load duoc.");
if (hlsCount) {
  console.log(
    `\n${hlsCount} dai dung HLS (.m3u8). Lavalink load duoc nhung HLS co the dut\n` +
      "ngay sau khi ket noi voice — bot se tu phat lai toi da 3 lan roi bao loi."
  );
}
process.exit(failed ? 1 : 0);
