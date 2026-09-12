import { describe, it, expect } from "vitest";
import { authErrorHint, isNodeAuthError } from "../src/music/node-error.js";

describe("isNodeAuthError", () => {
  it("detects the 401 the bot actually saw when Lavalink used the default password", () => {
    const error = new Error("Unexpected server response: 401");

    expect(isNodeAuthError(error)).toBe(true);
  });

  it("detects 403 as well", () => {
    expect(isNodeAuthError(new Error("Unexpected server response: 403"))).toBe(true);
  });

  it("ignores unrelated node failures", () => {
    expect(isNodeAuthError(new Error("connect ECONNREFUSED 127.0.0.1:2333"))).toBe(false);
    expect(isNodeAuthError(new Error("Unexpected server response: 502"))).toBe(false);
    expect(isNodeAuthError(undefined)).toBe(false);
  });

  it("reads only the first line of a multi-line stack", () => {
    expect(isNodeAuthError(new Error("boom\r\nstatus 401 in second line"))).toBe(false);
  });

  it("suggests running through the script", () => {
    expect(authErrorHint()).toContain("start.ps1");
  });
});
