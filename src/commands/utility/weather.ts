import { MessageFlags, SlashCommandBuilder, type StringSelectMenuInteraction } from "discord.js";
import type { Command } from "../../types/command.js";
import { embed, EMBED_COLORS, NO_PING, privateReply, silentReply } from "../../utils/embed.js";
import { getForecast, getLocation, searchLocations, WeatherError } from "../../weather/weather-service.js";
import { locationCard, weatherCard, WEATHER_SELECT_PREFIX } from "../../weather/weather-card.js";

async function resultCard(work: () => Promise<ReturnType<typeof embed>>) {
  try { return await work(); }
  catch (error) {
    return embed(error instanceof WeatherError ? error.message : "Không lấy được thời tiết. Vui lòng thử lại sau.", EMBED_COLORS.error, "Thời tiết");
  }
}

async function searchCard(query: string, owner: string) {
  return resultCard(async () => {
    const places = await searchLocations(query);
    if (!places.length) throw new WeatherError("Không tìm thấy địa điểm. Thử tên thành phố kèm quốc gia, ví dụ: Paris, France.");
    if (places.length > 1) return locationCard(places, owner);
    return weatherCard(places[0], await getForecast(places[0]));
  });
}

export async function handleWeatherSelection(interaction: StringSelectMenuInteraction) {
  if (interaction.customId !== `${WEATHER_SELECT_PREFIX}${interaction.user.id}`) {
    await interaction.reply(privateReply(embed("Chỉ người gọi lệnh được chọn địa điểm. Hãy dùng /weather để xem thời tiết của bạn.", EMBED_COLORS.error, "Thời tiết")));
    return;
  }
  await interaction.deferUpdate();
  const card = await resultCard(async () => {
    const place = await getLocation(interaction.values[0] ?? "");
    return weatherCard(place, await getForecast(place));
  });
  await interaction.editReply({ components: [card], allowedMentions: NO_PING });
}

export const command: Command = {
  data: new SlashCommandBuilder().setName("weather").setDescription("Thời tiết hiện tại và dự báo 7 ngày")
    .addStringOption(option => option.setName("diadiem").setDescription("Tên thành phố, có thể kèm quốc gia")
      .setRequired(true).setMinLength(2).setMaxLength(100)),
  aliases: ["thoitiet"],
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const card = await searchCard(interaction.options.getString("diadiem", true), interaction.user.id);
    await interaction.editReply({ components: [card], flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2, allowedMentions: NO_PING });
  },
  async executeMessage(message, args) {
    const sent = await message.reply(silentReply(embed("Đang tìm địa điểm và lấy dự báo…", EMBED_COLORS.default, "Thời tiết")));
    const card = await searchCard(args.join(" "), message.author.id);
    await sent.edit({ components: [card], allowedMentions: NO_PING });
  },
};
