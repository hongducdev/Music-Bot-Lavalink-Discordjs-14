import { describe, it, expect } from "vitest";
import { PermissionsBitField } from "discord.js";
import {
  REQUIRED_TEXT_PERMISSIONS,
  REQUIRED_VOICE_PERMISSIONS,
  permissionNames,
} from "../src/utils/permissions.js";

describe("REQUIRED_VOICE_PERMISSIONS", () => {
  it("covers connecting and speaking", () => {
    expect([...REQUIRED_VOICE_PERMISSIONS]).toEqual(["Connect", "Speak"]);
  });
});

describe("REQUIRED_TEXT_PERMISSIONS", () => {
  it("covers sending messages and embeds", () => {
    expect([...REQUIRED_TEXT_PERMISSIONS]).toEqual(["SendMessages", "EmbedLinks"]);
  });
});

describe("permissionNames", () => {
  it("returns nothing when every permission is present", () => {
    const granted = new PermissionsBitField(PermissionsBitField.Flags.Connect | PermissionsBitField.Flags.Speak);

    expect(permissionNames(REQUIRED_VOICE_PERMISSIONS, granted)).toEqual([]);
  });

  it("returns the localized names of the missing permissions", () => {
    const granted = new PermissionsBitField(PermissionsBitField.Flags.Connect);

    expect(permissionNames(REQUIRED_VOICE_PERMISSIONS, granted)).toEqual(["Nói (Speak)"]);
  });

  it("reports every permission when the field is missing", () => {
    expect(permissionNames(REQUIRED_VOICE_PERMISSIONS, null)).toEqual([
      "Kết nối (Connect)",
      "Nói (Speak)",
    ]);
  });
});
