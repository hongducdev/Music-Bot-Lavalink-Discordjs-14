import { describe, it, expect } from "vitest";
import { Collection, MessageMentions, PermissionsBitField, type Client } from "discord.js";
import { buildBotInfoEmbed, inviteButton, inviteUrl, shouldShowBotInfo, stripBotMention, type MentionInfo } from "../src/bot-info.js";

const BOT_ID = "999";

const mentions = (
  ids: string[],
  extra: Partial<MentionInfo> = {},
  /** Mac dinh: moi user trong `mentions` deu den tu token ping trong noi dung. */
  parsedIds: string[] = ids
): MentionInfo => ({
  everyone: false,
  roles: { size: 0 },
  users: { has: (id: string) => ids.includes(id) },
  parsedUsers: { has: (id: string) => parsedIds.includes(id) },
  ...extra,
});

describe("shouldShowBotInfo", () => {
  it("answers when the bot is mentioned directly", () => {
    expect(shouldShowBotInfo(mentions([BOT_ID]), BOT_ID)).toBe(true);
  });

  it("stays quiet when someone else is mentioned", () => {
    expect(shouldShowBotInfo(mentions(["123"]), BOT_ID)).toBe(false);
    expect(shouldShowBotInfo(mentions([]), BOT_ID)).toBe(false);
  });

  it("ignores @everyone and @here even when the bot is also mentioned", () => {
    expect(shouldShowBotInfo(mentions([BOT_ID], { everyone: true }), BOT_ID)).toBe(false);
    expect(shouldShowBotInfo(mentions([], { everyone: true }), BOT_ID)).toBe(false);
  });

  it("ignores role pings even when the bot is also mentioned", () => {
    expect(shouldShowBotInfo(mentions([BOT_ID], { roles: { size: 1 } }), BOT_ID)).toBe(false);
    expect(shouldShowBotInfo(mentions([], { roles: { size: 3 } }), BOT_ID)).toBe(false);
  });

  it("stays quiet when the bot is only mentioned because someone replied to it", () => {
    // Reply lam Discord tu them tac gia tin nhan duoc reply vao `mentions.users`,
    // nhung noi dung nguoi dung go khong he chua token ping nao.
    expect(shouldShowBotInfo(mentions([BOT_ID], {}, []), BOT_ID)).toBe(false);
  });

  it("still answers when the ping is actually written in the content", () => {
    expect(shouldShowBotInfo(mentions([BOT_ID], {}, [BOT_ID]), BOT_ID)).toBe(true);
  });

  it("does not answer a reply to the bot when someone else is pinged in the text", () => {
    expect(shouldShowBotInfo(mentions([BOT_ID, "123"], {}, ["123"]), BOT_ID)).toBe(false);
  });

  /**
   * Guard cho gia dinh cot loi cua fix: `mentions.users` THAT SU gom tac gia tin nhan duoc
   * reply, con `mentions.parsedUsers` thi khong. Test nay dung lop that cua discord.js thay vi
   * mock, de neu discord.js doi ngu nghia thi no vo ngay tai day.
   */
  it("relies on real MessageMentions: replied author lands in users but not parsedUsers", () => {
    const BOT = "999000000000000001";
    const cache = new Collection<string, { id: string; username: string }>([
      [BOT, { id: BOT, username: "MusicBot" }],
    ]);
    const client = {
      users: {
        cache,
        _add: (user: { id: string }) => cache.get(user.id),
      },
    } as unknown as Client;

    const build = (content: string) => {
      const message = { client, guild: null, content } as any;
      // (message, users, roles, everyone, crosspostedChannels, repliedUser)
      return new MessageMentions(
        message,
        [{ id: BOT, username: "MusicBot" }],
        [],
        false,
        undefined,
        { id: BOT, username: "MusicBot" }
      );
    };

    // Reply binh thuong: Discord van bao co mention bot, nhung noi dung khong he ping.
    const reply = build("bài này hay đấy");
    expect(reply.users.has(BOT)).toBe(true);
    expect(reply.parsedUsers.has(BOT)).toBe(false);
    expect(shouldShowBotInfo(reply as unknown as MentionInfo, BOT)).toBe(false);

    // Reply nhung co ping that trong noi dung -> van phai tra loi.
    const replyWithPing = build(`<@${BOT}> bài này hay đấy`);
    expect(replyWithPing.parsedUsers.has(BOT)).toBe(true);
    expect(shouldShowBotInfo(replyWithPing as unknown as MentionInfo, BOT)).toBe(true);
  });
});

describe("stripBotMention", () => {
  it("returns the rest of the message for a normal bot mention", () => {
    expect(stripBotMention(`<@${BOT_ID}> play con ca con chim`, BOT_ID)).toBe("play con ca con chim");
  });

  it("handles the legacy nickname mention and leading spaces", () => {
    expect(stripBotMention(`<@!${BOT_ID}> skip`, BOT_ID)).toBe("skip");
    expect(stripBotMention(`   <@${BOT_ID}>   skip  `, BOT_ID)).toBe("skip");
  });

  it("strips to an empty body for a bare ping", () => {
    expect(stripBotMention(`<@${BOT_ID}>`, BOT_ID)).toBe("");
  });

  it("returns null for another user, a role ping, @everyone or a prefix command", () => {
    expect(stripBotMention("<@123> play x", BOT_ID)).toBeNull();
    expect(stripBotMention("<@&456> play x", BOT_ID)).toBeNull();
    expect(stripBotMention("@everyone play x", BOT_ID)).toBeNull();
    expect(stripBotMention("!play x", BOT_ID)).toBeNull();
    expect(stripBotMention("", BOT_ID)).toBeNull();
  });
});

describe("buildBotInfoEmbed", () => {
  const client = {
    user: { id: BOT_ID, username: "MusicBot", displayAvatarURL: () => "https://cdn.test/avatar.png" },
    ws: { ping: 42 },
    uptime: 3_723_000,
    guilds: {
      cache: {
        size: 2,
        reduce: (fn: (sum: number, guild: { memberCount: number }) => number, init: number) =>
          [{ memberCount: 10 }, { memberCount: 5 }].reduce(fn, init),
      },
    },
  } as unknown as Client;

  it("renders ping, uptime, scale, prefix and author", () => {
    const json = buildBotInfoEmbed(client, "!", 11).toJSON();
    const fields = Object.fromEntries((json.fields ?? []).map((f) => [f.name, f.value]));

    expect(fields["🏓 | Ping"]).toBe("`42ms`");
    expect(fields["⏱️ | Hoạt động"]).toBe("`1:02:03`");
    expect(fields["🌐 | Server"]).toBe("`2`");
    expect(fields["👥 | Thành viên"]).toBe("`15`");
    expect(fields["💬 | Prefix"]).toBe("`!`");
    expect(json.description).toContain("MusicBot");
    expect(json.description).toContain("11");
    expect(json.thumbnail?.url).toBe("https://cdn.test/avatar.png");
    expect(json.footer?.text).toBe("Ví dụ: !play con cá con chim");
  });

  it("works before the client has a user", () => {
    const noUser = { ...client, user: null } as unknown as Client;
    const json = buildBotInfoEmbed(noUser, "!", 1).toJSON();
    expect(json.description).toContain("MusicBot");
    expect(json.footer?.text).toBe("Ví dụ: !play con cá con chim");
  });

  it("invites through the link button, not the footer", () => {
    const needed = PermissionsBitField.resolve(["ViewChannel", "SendMessages", "EmbedLinks", "Connect", "Speak"]);
    const url = `https://discord.com/oauth2/authorize?client_id=${BOT_ID}&scope=bot+applications.commands&permissions=${needed}`;
    expect(needed & PermissionsBitField.Flags.Administrator).toBe(0n);
    expect(inviteUrl(BOT_ID)).toBe(url);
    expect(buildBotInfoEmbed(client, "!", 11).toJSON().footer?.text).not.toContain("http");
    expect(inviteButton(BOT_ID).toJSON()).toEqual({
      type: 1,
      components: [{ type: 2, style: 5, label: "Mời bot", url }],
    });
  });
});
