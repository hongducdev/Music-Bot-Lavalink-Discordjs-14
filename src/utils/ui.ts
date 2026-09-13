/** Native Discord emoji only: headings and controls share the same vocabulary. */
export const UI_ICONS = {
  play: "▶️", pause: "⏸️", skip: "⏭️", shuffle: "🔀", loop: "🔁", loopTrack: "🔂",
  stop: "⏹️", queue: "🎶", music: "🎵", radio: "📻", volume: "🔊", settings: "🎛️",
  help: "📖", ping: "🏓", weather: "🌤️", link: "🔗", info: "ℹ️", error: "⚠️",
} as const;

// Strip decoration from labels only; never alter song titles or provider/user content.
export function plainLabel(label: string): string {
  return label.replace(/^(?:\p{Extended_Pictographic}[\uFE0F\u200D\p{Emoji_Modifier}]*\s*)+/u, "").trim();
}

export function cardHeading(title: string, error = false): string {
  const label = plainLabel(title);
  const rules: [RegExp, string][] = [
    [/tạm dừng/i, UI_ICONS.pause], [/dừng/i, UI_ICONS.stop], [/trộn/i, UI_ICONS.shuffle],
    [/hàng đợi|playlist/i, UI_ICONS.queue],
    [/đang phát|phát nhạc|tiếp tục/i, UI_ICONS.play], [/bỏ qua/i, UI_ICONS.skip],
    [/lặp/i, UI_ICONS.loop],
    [/radio/i, UI_ICONS.radio], [/âm lượng/i, UI_ICONS.volume],
    [/hiệu ứng|điều khiển|tua|tự động/i, UI_ICONS.settings],
    [/trợ giúp|lệnh /i, UI_ICONS.help], [/ping/i, UI_ICONS.ping],
    [/thời tiết/i, UI_ICONS.weather], [/rpc/i, UI_ICONS.link],
  ];
  const existing = title.trimStart().match(/^\p{Extended_Pictographic}\uFE0F?/u)?.[0];
  const icon = error ? UI_ICONS.error : rules.find(([pattern]) => pattern.test(label))?.[1] ?? existing ?? UI_ICONS.info;
  return `${icon} ${label}`;
}
