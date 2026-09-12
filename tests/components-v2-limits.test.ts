import { describe, it, expect } from "vitest";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type Client,
} from "discord.js";
import {
  EMBED_COLORS,
  embed,
  privateReply,
  silentReply,
  type MessageContainerBuilder,
} from "../src/utils/embed.js";
import { buildBotInfoEmbed, inviteButton } from "../src/bot-info.js";
import { buildRadioEmbed, buildRadioSelectMenu } from "../src/music/radio.js";
import { buildMusicController } from "../src/music/controller.js";

/**
 * Guard cho Components V2: moi card that phai nam trong gioi han API cua Discord.
 * Nguon: https://docs.discord.com/developers/components/reference.md
 * Day la phan DO DUOC cua "lam dep" — no khong noi card co dep hay khong,
 * chi noi card co hop le voi API hay khong.
 */

const MAX_COMPONENTS_PER_MESSAGE = 40;
const MAX_TEXT_DISPLAY_LENGTH = 4000;
const MAX_MEDIA_DESCRIPTION = 1024;
const MAX_BUTTONS_PER_ROW = 5;
const BUTTON_LABEL_MAX = 38;

type AnyComponent = Record<string, any>;

/** Dem de quy moi node component (Container/Section/ActionRow tinh la node cha). */
function countComponents(nodes: AnyComponent[]): number {
  return nodes.reduce((sum, node) => {
    const children = Array.isArray(node.components) ? countComponents(node.components) : 0;
    const accessory = node.accessory ? countComponents([node.accessory]) : 0;
    return sum + 1 + children + accessory;
  }, 0);
}

function walk(nodes: AnyComponent[], visit: (node: AnyComponent) => void): void {
  for (const node of nodes) {
    visit(node);
    if (Array.isArray(node.components)) walk(node.components, visit);
  }
}

/** Nem loi neu payload vi pham bat ky gioi han API nao. */
function assertValidV2(nodes: AnyComponent[]): void {
  const total = countComponents(nodes);
  expect(total, `qua ${MAX_COMPONENTS_PER_MESSAGE} component`).toBeLessThanOrEqual(
    MAX_COMPONENTS_PER_MESSAGE
  );

  walk(nodes, (node) => {
    if (node.type === 10) {
      expect(typeof node.content).toBe("string");
      expect(node.content.length, "Text Display qua dai").toBeLessThanOrEqual(
        MAX_TEXT_DISPLAY_LENGTH
      );
    }

    if (node.type === 9) {
      const children = node.components ?? [];
      expect(children.length, "Section phai co 1-3 child").toBeGreaterThanOrEqual(1);
      expect(children.length, "Section toi da 3 child").toBeLessThanOrEqual(3);
      expect(children.every((c: AnyComponent) => c.type === 10), "Section child phai la Text Display").toBe(true);
      expect(node.accessory, "Section phai co accessory").toBeDefined();
      expect([2, 11], "accessory chi duoc la Button hoac Thumbnail").toContain(node.accessory.type);
    }

    if (node.type === 11) {
      if (node.description !== undefined) {
        expect(node.description.length, "Alt text qua dai").toBeLessThanOrEqual(
          MAX_MEDIA_DESCRIPTION
        );
      }
    }

    if (node.type === 12) {
      expect(node.items.length, "Media Gallery can 1-10 item").toBeGreaterThanOrEqual(1);
      expect(node.items.length, "Media Gallery toi da 10 item").toBeLessThanOrEqual(10);
    }

    if (node.type === 14) {
      expect([1, 2], "separator spacing chi duoc 1 hoac 2").toContain(node.spacing ?? 1);
    }

    if (node.type === 17) {
      expect(node.accent_color, "mau accent phai nam trong 0x000000-0xFFFFFF").toBeLessThanOrEqual(
        0xffffff
      );
      expect(node.accent_color).toBeGreaterThanOrEqual(0);
    }

    if (node.type === 1) {
      const children = node.components ?? [];
      const buttons = children.filter((c: AnyComponent) => c.type === 2);
      const selects = children.filter((c: AnyComponent) => c.type !== 2);
      const isButtonRow = buttons.length === children.length;

      if (isButtonRow) {
        expect(buttons.length, "Action Row toi da 5 button").toBeLessThanOrEqual(MAX_BUTTONS_PER_ROW);
      } else {
        expect(children.length, "Action Row chi chua 1 select").toBe(1);
        expect(selects.length).toBe(1);
      }

      // Button Design Guidelines: chi mot Primary moi nhom.
      const primaries = buttons.filter((b: AnyComponent) => b.style === 1);
      expect(primaries.length, "chi duoc 1 Primary button moi Action Row").toBeLessThanOrEqual(1);

      for (const button of buttons) {
        if (button.label !== undefined) {
          expect(button.label.length, "label button qua dai").toBeLessThanOrEqual(BUTTON_LABEL_MAX);
        }
      }
    }
  });
}

function payloadComponents(builder: MessageContainerBuilder, rows: ActionRowBuilder<any>[] = []) {
  const payload = privateReply(builder, rows);
  return (payload.components as MessageContainerBuilder[]).map((component) =>
    typeof (component as any).toJSON === "function"
      ? ((component as any).toJSON() as AnyComponent)
      : (component as unknown as AnyComponent)
  );
}

const fakePlayer = {
  paused: false,
  volume: 100,
  guildId: "guild-1",
  repeatMode: "off",
  queue: { tracks: [] },
} as any;

const fakeClient = {
  user: {
    id: "999",
    username: "MusicBot",
    displayAvatarURL: () => "https://cdn.test/avatar.png",
  },
  ws: { ping: 42 },
  uptime: 3_723_000,
  guilds: {
    cache: {
      size: 2,
      reduce: (fn: (sum: number, g: { memberCount: number }) => number, init: number) =>
        [{ memberCount: 10 }, { memberCount: 5 }].reduce(fn, init),
    },
  },
} as unknown as Client;

describe("Components V2 API limits", () => {
  it("text-only card stays valid", () => {
    assertValidV2(payloadComponents(embed("hello")));
  });

  it("error card with accent color stays valid", () => {
    assertValidV2(payloadComponents(embed("boom", EMBED_COLORS.error, "Lỗi")));
  });

  it("full card (thumbnail + fields + footer + timestamp + buttons) stays valid", () => {
    const card = embed("▶️ | Đang phát:\n> Bài hát", EMBED_COLORS.default, "Now playing")
      .setSectionNote("🎵 Kênh · ⏱️ 3:45")
      .setThumbnail("https://i.ytimg.com/vi/abc/hqdefault.jpg", "Ảnh bìa bài hát")
      .addFields(
        { name: "Trạng thái", value: "Đang phát", inline: false },
        { name: "Yêu cầu bởi", value: "User", inline: false }
      )
      .setFooter({ text: "3 bài trong hàng đợi" })
      .setTimestamp();

    assertValidV2(payloadComponents(card, [buildMusicController(fakePlayer)]));
  });

  it("section never exceeds 3 text displays even with author + description + note", () => {
    const json = payloadComponents(
      embed("Mô tả", EMBED_COLORS.default, "Tác giả")
        .setSectionNote("Dòng thứ ba")
        .setThumbnail("https://x/y.png")
    )[0]?.components ?? [];
    const section = (json as AnyComponent[]).find((c) => c.type === 9);
    expect(section?.components.length).toBe(3);
  });

  it("clips oversized description and alt text to API limits", () => {
    const card = embed("x".repeat(9000))
      .setThumbnail("https://x/y.png", "a".repeat(3000));

    assertValidV2(payloadComponents(card));
  });

  it("renders action rows INSIDE the container, not as detached siblings", () => {
    const payload = payloadComponents(embed("hi"), [buildMusicController(fakePlayer)]);

    expect(payload.length, "chi duoc co 1 component cap cao la Container").toBe(1);
    expect(payload[0].type).toBe(17);

    const rows = (payload[0].components as AnyComponent[]).filter((c) => c.type === 1);
    expect(rows.length, "Action Row phai nam trong Container").toBe(1);
  });

  it("buildBotInfoEmbed stays valid with its invite button", () => {
    const card = buildBotInfoEmbed(fakeClient, "!", 11);
    assertValidV2(payloadComponents(card, [inviteButton("999")]));
  });

  it("buildRadioEmbed stays valid with its station select menu", () => {
    assertValidV2(payloadComponents(buildRadioEmbed(), [buildRadioSelectMenu()]));
  });

  it("silentReply payload keeps the same component limits", () => {
    const payload = silentReply(embed("hi", EMBED_COLORS.default, "X"), [
      buildMusicController(fakePlayer),
    ]).components.map((component: any) => component.toJSON() as AnyComponent);
    assertValidV2(payload);
  });

  it("every music controller button has a short label and no more than one Primary", () => {
    assertValidV2([buildMusicController(fakePlayer).toJSON() as unknown as AnyComponent]);
  });

  it("counts nested components so a bloated card would be caught", () => {
    // Chong hoi quy: guard phai thuc su dem duoc node con, neu khong se vo dung.
    const nested = [
      {
        type: 17,
        accent_color: 0,
        components: [
          {
            type: 9,
            components: [{ type: 10, content: "a" }],
            accessory: { type: 11, media: { url: "u" } },
          },
        ],
      },
    ];
    // container + section + text display + thumbnail accessory
    expect(countComponents(nested)).toBe(4);
  });
});
