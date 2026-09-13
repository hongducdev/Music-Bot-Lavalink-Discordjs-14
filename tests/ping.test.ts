import { performance } from "node:perf_hooks";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MessageFlags, type ChatInputCommandInteraction, type Message } from "discord.js";
import { command } from "../src/commands/utility/ping.js";

afterEach(() => vi.restoreAllMocks());

describe("ping measurement", () => {
  it.each(["slash", "prefix"])("measures the awaited %s reply independently of wall-clock skew", async (kind) => {
    let monotonic = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => monotonic);
    const wallClock = vi.spyOn(Date, "now").mockReturnValue(10_000);
    vi.spyOn(process, "uptime").mockReturnValue(270);
    const edit = vi.fn(async (_payload: { components: unknown[]; allowedMentions?: unknown }) => {});
    const reply = vi.fn(async (_payload: { flags: number; allowedMentions?: unknown }) => {
      await Promise.resolve();
      monotonic += 123.4;
      wallClock.mockReturnValue(5000); // System clock moves backwards during the request.
      return { edit };
    });
    const context = {
      createdTimestamp: 10_140, // Old formula reports -140ms even before the rollback.
      client: { ws: { ping: 283 }, user: null },
      reply, editReply: edit,
    };

    if (kind === "slash") await command.execute(context as unknown as ChatInputCommandInteraction);
    else await command.executeMessage!(context as unknown as Message, []);

    expect(reply).toHaveBeenCalledTimes(1);
    expect(edit).toHaveBeenCalledTimes(1);
    const text = JSON.stringify(edit.mock.calls[0][0]);
    expect(text).toContain("123 ms");
    expect(text).toContain("283 ms");
    expect(text).toContain("Gateway heartbeat");
    expect(text).toContain("HTTP phản hồi");
    expect(text).toContain("4:30");
    expect(text).not.toContain("-140");
    const payload = reply.mock.calls[0][0];
    expect(payload.flags & MessageFlags.IsComponentsV2).toBe(MessageFlags.IsComponentsV2);
    expect(payload.flags & MessageFlags.Ephemeral).toBe(kind === "slash" ? MessageFlags.Ephemeral : 0);
    if (kind === "prefix") expect(payload.flags & MessageFlags.SuppressNotifications).toBe(MessageFlags.SuppressNotifications);
    expect(payload.allowedMentions).toEqual({ parse: [] });
    expect(edit.mock.calls[0][0].allowedMentions).toEqual({ parse: [] });
  });

  it.each([-1, NaN, Infinity])("shows unknown rather than a bogus heartbeat: %s", async ping => {
    const editReply = vi.fn(async (_payload: { components: unknown[] }) => {});
    await command.execute({
      client: { ws: { ping }, user: null }, reply: async () => {}, editReply,
    } as unknown as ChatInputCommandInteraction);
    expect(JSON.stringify(editReply.mock.calls[0][0])).toContain("Chưa có dữ liệu");
  });

  it("does not publish a successful measurement when sending fails", async () => {
    const editReply = vi.fn();
    await expect(command.execute({
      client: { ws: { ping: 283 }, user: null },
      reply: async () => { throw new Error("Network failed"); }, editReply,
    } as unknown as ChatInputCommandInteraction)).rejects.toThrow("Network failed");
    expect(editReply).not.toHaveBeenCalled();
  });
});
