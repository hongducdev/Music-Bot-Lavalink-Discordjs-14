import { MessageFlags, SlashCommandBuilder, type Client } from "discord.js";
import type { Command } from "../../types/command.js";
import { embed, privateReply, silentReply } from "../../utils/embed.js";
import type {} from "../../rpc/requester-rpc.js";

function response(client: Client, userId: string, action: string): string {
  const rpc = client.requesterRpc;
  if (!rpc) return "RPC chưa được bật. Chủ bot cần cấu hình OAuth2 trước.";
  if (action === "disconnect") {
    rpc.disconnect(userId);
    return "Đã ngắt RPC và xóa phiên liên kết trong bot. Bạn có thể thu hồi quyền ứng dụng tại Discord → Authorized Apps.";
  }
  if (action === "status") return rpc.connected(userId)
    ? "Đã liên kết RPC. Bot hiển thị bài đang phát trên profile khi bạn ngồi cùng kênh voice với bot; bài bạn yêu cầu thì luôn hiển thị."
    : "Chưa kết nối RPC hoặc phiên đã hết hạn/mất kết nối. Dùng `/rpc connect` để liên kết.";
  if (action !== "connect") return "Dùng `rpc connect`, `rpc status` hoặc `rpc disconnect`.";
  try {
    return `[Liên kết Discord để hiển thị bài hát](${rpc.connectLink(userId)})\nLink có hiệu lực 5 phút; đăng nhập đúng tài khoản gọi lệnh. Phiên liên kết mất khi bot khởi động lại.`;
  } catch { return "RPC hiện không khả dụng. Vui lòng thử lại sau."; }
}

export const command: Command = {
  data: new SlashCommandBuilder().setName("rpc").setDescription("Hiển thị bài hát trên profile của bạn")
    .addSubcommand(sub => sub.setName("connect").setDescription("Liên kết Discord với RPC"))
    .addSubcommand(sub => sub.setName("status").setDescription("Xem trạng thái liên kết RPC"))
    .addSubcommand(sub => sub.setName("disconnect").setDescription("Ngắt và xóa phiên RPC")),
  async execute(interaction) {
    await interaction.reply(privateReply(embed(
      response(interaction.client, interaction.user.id, interaction.options.getSubcommand()), undefined, "RPC"
    )));
  },
  async executeMessage(message, args) {
    const action = args[0]?.toLowerCase() || "status";
    const text = response(message.client, message.author.id, action);
    if (action === "connect") {
      try {
        await message.author.send({ components: [embed(text, undefined, "RPC")], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } });
        await message.reply(silentReply(embed("Đã gửi hướng dẫn RPC qua tin nhắn riêng.", undefined, "RPC")));
      } catch {
        await message.reply(silentReply(embed("Không gửi được DM. Dùng `/rpc connect` để nhận link riêng tư.", undefined, "RPC")));
      }
    } else {
      await message.reply(silentReply(embed(text, undefined, "RPC")));
    }
  },
};
