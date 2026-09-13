import { ActionRowBuilder, escapeMarkdown, StringSelectMenuBuilder } from "discord.js";
import { embed, EMBED_COLORS } from "../utils/embed.js";
import { clip } from "../utils/text.js";
import type { WeatherForecast, WeatherLocation } from "./weather-service.js";

export const WEATHER_SELECT_PREFIX = "weather_place:";
export const locationLabel = (place: WeatherLocation) => [...new Set([place.name, place.admin1, place.country].filter(Boolean))].join(", ");
const value = (n: number | null | undefined, unit: string) => n == null || !Number.isFinite(n) ? "—" : `${Math.round(n * 10) / 10}${unit}`;

export function condition(code: number | null | undefined, night = false): string {
  if (code === 0) return night ? "🌙 Trời quang" : "☀️ Trời quang";
  if (code === 1) return "🌤️ Ít mây";
  if (code === 2) return "⛅ Mây rải rác";
  if (code === 3) return "☁️ Nhiều mây";
  if (code === 45 || code === 48) return "🌫️ Sương mù";
  if ([51, 53, 55].includes(code ?? -1)) return "🌦️ Mưa phùn";
  if ([56, 57, 66, 67].includes(code ?? -1)) return "🌧️ Mưa đóng băng";
  if ([61, 63, 65, 80, 81, 82].includes(code ?? -1)) return "🌧️ Mưa";
  if ([71, 73, 75, 77, 85, 86].includes(code ?? -1)) return "🌨️ Tuyết";
  if (code === 95) return "⛈️ Dông";
  if (code === 96 || code === 99) return "⛈️ Dông, mưa đá";
  return "❔ Chưa rõ";
}

export function locationCard(places: WeatherLocation[], owner: string) {
  const menu = new StringSelectMenuBuilder().setCustomId(`${WEATHER_SELECT_PREFIX}${owner}`)
    .setPlaceholder("Chọn địa điểm cần xem").setMinValues(1).setMaxValues(1)
    .addOptions(places.map(place => ({
      label: clip(place.name, 100), value: String(place.id),
      description: clip([place.admin1, place.country, `${place.latitude}, ${place.longitude}`].filter(Boolean).join(" · "), 100),
    })));
  return embed("Có nhiều địa điểm phù hợp. Chọn nơi bạn muốn xem bên dưới.", EMBED_COLORS.default, "📍 Thời tiết")
    .addActionRows(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu))
    .setFooter({ text: "Địa danh: GeoNames qua Open-Meteo · Chỉ người gọi lệnh được chọn." });
}

export function weatherCard(place: WeatherLocation, forecast: WeatherForecast) {
  const now = forecast.current.values;
  const today = forecast.daily.find(day => day.time === forecast.current.time.slice(0, 10))?.values;
  // API ISO strings are local to the selected location; never parse with the bot host's timezone.
  const hourly = forecast.hourly.filter(hour => hour.time > forecast.current.time).slice(0, 6);
  const daily = forecast.daily.slice(0, 7);
  return embed(`## ${value(now.temperature_2m, "°C")} · ${condition(now.weather_code, now.is_day === 0)}\nCảm giác như **${value(now.apparent_temperature, "°C")}**`,
    EMBED_COLORS.default, `📍 ${escapeMarkdown(locationLabel(place))}`)
    .addFields(
      { name: "Hiện tại", value: `Độ ẩm **${value(now.relative_humidity_2m, "%")}** · Gió **${value(now.wind_speed_10m, " km/h")}**` },
      { name: "Hôm nay", value: `Thấp / cao **${value(today?.temperature_2m_min, "°")} / ${value(today?.temperature_2m_max, "°")}**\nKhả năng mưa cao nhất **${value(today?.precipitation_probability_max, "%")}** · UV tối đa **${value(today?.uv_index_max, "")}**` },
      { name: "6 giờ tới", value: hourly.map(({ time, values: h }) => `**${time.slice(11)}** · ${value(h.temperature_2m, "°C")} · ${condition(h.weather_code)} · 💧 ${value(h.precipitation_probability, "%")}`).join("\n") || "Chưa có dữ liệu" },
      { name: "7 ngày", value: daily.map(({ time, values: d }) => `**${time.slice(8, 10)}/${time.slice(5, 7)}** · ${value(d.temperature_2m_min, "°")} / ${value(d.temperature_2m_max, "°")} · ${condition(d.weather_code)} · 💧 ${value(d.precipitation_probability_max, "%")}`).join("\n") || "Chưa có dữ liệu" },
    )
    .setSectionNote(`Giờ địa phương: ${forecast.current.time.replace("T", " ")} · ${escapeMarkdown(forecast.timezone)}`)
    .setFooter({ text: "Dự báo: [Open-Meteo](https://open-meteo.com/) · Địa danh: [GeoNames](https://www.geonames.org/) · 💧 Khả năng mưa" });
}
