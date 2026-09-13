export interface WeatherLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1: string;
  country: string;
}

type Values = Record<string, number | null>;
export interface WeatherPeriod { time: string; values: Values }
export interface WeatherForecast {
  timezone: string;
  current: WeatherPeriod;
  hourly: WeatherPeriod[];
  daily: WeatherPeriod[];
}

export class WeatherError extends Error {}
const unavailable = () => new WeatherError("Không lấy được dữ liệu thời tiết. Vui lòng thử lại sau.");
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const number = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
const text = (value: unknown): string => typeof value === "string" ? value.slice(0, 100) : "";
const localTime = (value: unknown): string => typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(value) ? value : "";

async function request(url: URL): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (response.status === 429) throw new WeatherError("Dịch vụ thời tiết đang giới hạn yêu cầu. Vui lòng thử lại sau.");
    if (!response.ok) throw unavailable();
    const data = record(await response.json());
    if (data.error) throw unavailable();
    return data;
  } catch (error) {
    throw error instanceof WeatherError ? error : unavailable();
  }
}

function location(value: unknown): WeatherLocation | null {
  const data = record(value);
  const id = number(data.id), latitude = number(data.latitude), longitude = number(data.longitude);
  if (!id || !Number.isSafeInteger(id) || id < 1 || latitude === null || longitude === null ||
    Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || !text(data.name).trim()) return null;
  return { id, latitude, longitude, name: text(data.name), admin1: text(data.admin1), country: text(data.country) };
}

export async function searchLocations(query: string): Promise<WeatherLocation[]> {
  const name = query.trim();
  if (name.length < 2 || name.length > 100) throw new WeatherError("Nhập tên địa điểm từ 2–100 ký tự, ví dụ: Hà Nội hoặc Paris, France.");
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({ name, count: "5", language: "vi", format: "json" }).toString();
  const data = await request(url);
  if (data.results === undefined) return [];
  if (!Array.isArray(data.results)) throw unavailable();
  return data.results.slice(0, 5).map(location).filter((item): item is WeatherLocation => item !== null);
}

export async function getLocation(id: string): Promise<WeatherLocation> {
  if (!/^[1-9]\d{0,11}$/.test(id)) throw new WeatherError("Địa điểm không hợp lệ. Hãy chạy lại lệnh weather.");
  const url = new URL("https://geocoding-api.open-meteo.com/v1/get");
  url.search = new URLSearchParams({ id, language: "vi" }).toString();
  const found = location(await request(url));
  if (!found || String(found.id) !== id) throw unavailable();
  return found;
}

function periods(value: unknown): WeatherPeriod[] {
  const data = record(value);
  if (!Array.isArray(data.time)) return [];
  return data.time.flatMap((time, index) => localTime(time) ? [{
    time: localTime(time),
    values: Object.fromEntries(Object.entries(data).filter(([key]) => key !== "time")
      .map(([key, values]) => [key, number(Array.isArray(values) ? values[index] : null)])),
  }] : []);
}

export async function getForecast(place: WeatherLocation): Promise<WeatherForecast> {
  if (!location(place)) throw unavailable();
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(place.latitude), longitude: String(place.longitude), timezone: "auto", forecast_days: "7",
    temperature_unit: "celsius", wind_speed_unit: "kmh", precipitation_unit: "mm",
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max",
  }).toString();
  const data = await request(url), current = record(data.current);
  if (!localTime(current.time) || !text(data.timezone)) throw unavailable();
  return {
    timezone: text(data.timezone),
    current: { time: localTime(current.time), values: Object.fromEntries(
      Object.entries(current).filter(([key]) => key !== "time").map(([key, value]) => [key, number(value)])) },
    hourly: periods(data.hourly), daily: periods(data.daily),
  };
}
