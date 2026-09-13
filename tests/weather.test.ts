import { afterEach, expect, it, vi } from "vitest";
import { MessageFlags, type ChatInputCommandInteraction, type Message, type StringSelectMenuInteraction } from "discord.js";
import { getForecast, getLocation, searchLocations } from "../src/weather/weather-service.js";
import { condition, locationCard, weatherCard } from "../src/weather/weather-card.js";
import { command, handleWeatherSelection } from "../src/commands/utility/weather.js";

const place = { id: 1581130, name: "Hà Nội", admin1: "Hà Nội", country: "Việt Nam", latitude: 21.0245, longitude: 105.8412 };
const data = {
  timezone: "Asia/Ho_Chi_Minh",
  current: { time: "2026-09-13T23:45", temperature_2m: 28.2, apparent_temperature: null, is_day: 0, weather_code: 0 },
  hourly: { time: ["2026-09-13T23:00", "2026-09-14T00:00"], temperature_2m: [29, 27], weather_code: [3, 61] },
  daily: { time: ["2026-09-13", "2026-09-14"], temperature_2m_min: [25, null], temperature_2m_max: [32, 31] },
};
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("validates search/id before requests and safely encodes user location", async () => {
  const fetch = vi.fn().mockResolvedValue(jsonResponse({ results: [place, { ...place, latitude: 999 }] }));
  vi.stubGlobal("fetch", fetch);
  await expect(searchLocations("x")).rejects.toThrow("2–100");
  await expect(getLocation("https://example.com")).rejects.toThrow("không hợp lệ");
  expect(fetch).not.toHaveBeenCalled();
  expect(await searchLocations("Hà Nội & country=VN")).toEqual([place]);
  expect(fetch.mock.calls[0][0].searchParams.get("name")).toBe("Hà Nội & country=VN");
  expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
});

it("keeps missing values unknown and forecasts in destination local time across midnight", async () => {
  const fetch = vi.fn().mockResolvedValue(jsonResponse(data));
  vi.stubGlobal("fetch", fetch);
  const forecast = await getForecast(place);
  const card = weatherCard(place, forecast).toJSON();
  const text = JSON.stringify(card);
  expect(text).toContain("00:00");
  expect(text).not.toContain("23:00");
  expect(text).toContain("14/09");
  expect(text).toContain("Cảm giác như **—**");
  expect(text).toContain("🌙 Trời quang");
  expect(text).toContain("Asia/Ho\\_Chi\\_Minh".replaceAll("\\", "\\\\"));
  expect(card.type).toBe(17);
  expect(card.components.length).toBeLessThan(40);
  expect(card.components.reduce((sum, part) => sum + ("content" in part ? part.content.length : 0), 0)).toBeLessThan(4000);
  expect(fetch.mock.calls[0][0].searchParams.get("timezone")).toBe("auto");
  expect(condition(null)).toContain("Chưa rõ");
  expect(condition(999)).toContain("Chưa rõ");
});

it("handles empty locations, mismatched ids, malformed provider response and rate limits", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(jsonResponse({}))
    .mockResolvedValueOnce(jsonResponse({ ...place, id: 1 }))
    .mockResolvedValueOnce(jsonResponse({ current: {} }))
    .mockResolvedValueOnce(jsonResponse({}, 429))
    .mockRejectedValueOnce(new Error("sensitive upstream detail"));
  vi.stubGlobal("fetch", fetch);
  expect(await searchLocations("Nowhere")).toEqual([]);
  await expect(getLocation(String(place.id))).rejects.toThrow("Không lấy được");
  await expect(getForecast(place)).rejects.toThrow("Không lấy được");
  await expect(searchLocations("Hanoi")).rejects.toThrow("giới hạn");
  await expect(searchLocations("Hanoi")).rejects.toThrow("Không lấy được");
});

it.each(["slash", "prefix"])("acknowledges %s before network and edits the original V2 message", async kind => {
  let acknowledged = false;
  vi.stubGlobal("fetch", vi.fn(async (url: URL) => {
    expect(acknowledged).toBe(true);
    return jsonResponse(url.pathname.endsWith("search") ? { results: [place] } : data);
  }));
  const edit = vi.fn(async (_payload: any) => {});
  const ack = vi.fn(async (_payload: any) => { acknowledged = true; return { edit }; });
  const context = { user: { id: "123" }, author: { id: "123" }, options: { getString: () => "Hanoi" }, deferReply: ack, reply: ack, editReply: edit };
  if (kind === "slash") await command.execute(context as unknown as ChatInputCommandInteraction);
  else await command.executeMessage!(context as unknown as Message, ["Hanoi"]);
  expect(edit).toHaveBeenCalledTimes(1);
  expect(edit.mock.calls[0][0].components[0].toJSON().type).toBe(17);
  expect(edit.mock.calls[0][0].allowedMentions).toEqual({ parse: [] });
  const flags = kind === "slash" ? edit.mock.calls[0][0].flags : ack.mock.calls[0][0].flags;
  expect(flags & MessageFlags.IsComponentsV2).toBe(MessageFlags.IsComponentsV2);
});

it("binds location selection to the caller and resolves provider id after acknowledging", async () => {
  let deferred = false;
  const fetch = vi.fn(async (url: URL) => {
    expect(deferred).toBe(true);
    return jsonResponse(url.pathname.endsWith("get") ? place : data);
  });
  vi.stubGlobal("fetch", fetch);
  const reply = vi.fn(), editReply = vi.fn();
  const context = { customId: "weather_place:123", user: { id: "456" }, values: [String(place.id)], reply, editReply, deferUpdate: async () => { deferred = true; } };
  await handleWeatherSelection(context as unknown as StringSelectMenuInteraction);
  expect(fetch).not.toHaveBeenCalled();
  expect(reply.mock.calls[0][0].flags & MessageFlags.Ephemeral).toBeTruthy();
  context.user.id = "123";
  await handleWeatherSelection(context as unknown as StringSelectMenuInteraction);
  expect(editReply).toHaveBeenCalledTimes(1);
  const menu = JSON.stringify(locationCard([place, { ...place, id: 2 }], "123").toJSON());
  expect(menu).toContain("weather_place:123");
});
