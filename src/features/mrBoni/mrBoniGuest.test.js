import { beforeEach, describe, expect, it, vi } from "vitest";

const identityKey = "hl:mrboni:guest:v1";
const claimKey = "hl:mrboni:guest-claim:v1";
const runId = "11111111-1111-4111-8111-111111111111";
beforeEach(() => { localStorage.clear(); vi.resetModules(); });

describe("Mr. Boni guest capabilities", () => {
  it("creates an unpredictable in-memory identity without writing on a page read", async () => {
    const guest = await import("./mrBoniGuest.js");
    const write = vi.spyOn(Storage.prototype, "setItem");
    const identity = guest.readMrBoniGuest();
    expect(identity.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(identity.key).toMatch(/^[0-9a-f]{64}$/);
    expect(guest.readMrBoniGuest()).toEqual(identity);
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
  });
  it("persists only when play requests it and keeps other game identities intact", async () => {
    const guest = await import("./mrBoniGuest.js");
    localStorage.setItem("hl:tipjar:guest:v1", "existing-tipjar-identity");
    const identity = guest.readMrBoniGuest();
    expect(guest.rememberMrBoniGuest(identity)).toBe(true);
    vi.resetModules();
    expect((await import("./mrBoniGuest.js")).readMrBoniGuest()).toEqual(identity);
    expect(localStorage.getItem("hl:tipjar:guest:v1")).toBe("existing-tipjar-identity");
    expect(JSON.parse(localStorage.getItem(identityKey))).toEqual(identity);
  });
  it("ignores malformed storage and survives browser storage denial", async () => {
    localStorage.setItem(identityKey, "not-json");
    const guest = await import("./mrBoniGuest.js");
    const identity = guest.readMrBoniGuest();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw Error("denied"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw Error("denied"); });
    expect(guest.readMrBoniGuest()).toEqual(identity);
    expect(guest.rememberMrBoniGuest(identity)).toBe(false);
    expect(() => guest.rememberMrBoniClaim(identity, { runId })).not.toThrow();
    expect(guest.readMrBoniClaim(identity)).toBeNull();
  });
  it("binds an unclaimed result to its browser identity and stores no capability in the claim", async () => {
    const guest = await import("./mrBoniGuest.js");
    const identity = guest.readMrBoniGuest();
    guest.rememberMrBoniClaim(identity, { runId });
    expect(JSON.parse(localStorage.getItem(claimKey))).toEqual({ guestId: identity.id, runId });
    expect(localStorage.getItem(claimKey)).not.toContain(identity.key);
    expect(guest.readMrBoniClaim(identity)).toEqual({ runId });
    expect(guest.readMrBoniClaim({ ...identity, id: "another-browser" })).toBeNull();
    guest.rememberMrBoniClaim(identity, null);
    expect(guest.readMrBoniClaim(identity)).toBeNull();
  });
  it("rejects corrupt claims without writing repairs on a read", async () => {
    const guest = await import("./mrBoniGuest.js");
    const identity = guest.readMrBoniGuest();
    for (const raw of ["{", JSON.stringify({ guestId: identity.id, runId: "invalid" }), JSON.stringify({ guestId: "other", runId })]) {
      localStorage.setItem(claimKey, raw);
      expect(guest.readMrBoniClaim(identity)).toBeNull();
      expect(localStorage.getItem(claimKey)).toBe(raw);
    }
  });
});
