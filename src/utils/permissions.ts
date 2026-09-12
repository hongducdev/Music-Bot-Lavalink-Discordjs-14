import { PermissionsBitField, type GuildMember } from "discord.js";

export const REQUIRED_VOICE_PERMISSIONS = ["Connect", "Speak"] as const;
export const REQUIRED_TEXT_PERMISSIONS = ["SendMessages", "EmbedLinks"] as const;

type PermissionName =
  | (typeof REQUIRED_VOICE_PERMISSIONS)[number]
  | (typeof REQUIRED_TEXT_PERMISSIONS)[number]
  | "ViewChannel";

const VI_LABELS: Record<PermissionName, string> = {
  Connect: "Kết nối (Connect)",
  Speak: "Nói (Speak)",
  SendMessages: "Gửi tin nhắn (Send Messages)",
  EmbedLinks: "Nhúng liên kết (Embed Links)",
  ViewChannel: "Xem kênh (View Channel)",
};

interface PermissionHolder {
  permissionsFor(member: GuildMember): Readonly<PermissionsBitField> | null;
}

/** Tra ve ten tieng Viet cua cac quyen con thieu; rong nghia la du quyen. */
export function permissionNames(
  required: readonly PermissionName[],
  permissions: Readonly<PermissionsBitField> | null | undefined
): string[] {
  if (!permissions) return required.map((name) => VI_LABELS[name]);
  return required
    .filter((name) => !permissions.has(PermissionsBitField.Flags[name]))
    .map((name) => VI_LABELS[name]);
}

/** Nhu permissionNames nhung tu lay quyen cua bot trong kenh; khong kiem tra duoc thi tra ve rong. */
export function missingChannelPermissions(
  required: readonly PermissionName[],
  channel: PermissionHolder | null | undefined,
  botMember: GuildMember | null | undefined
): string[] {
  if (!channel || !botMember) return [];
  return permissionNames(required, channel.permissionsFor(botMember));
}
