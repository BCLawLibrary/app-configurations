import { getAuth } from "firebase-admin/auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../../testing/apiRequest.js";
import { signInTestUser } from "../../testing/signInTestUser.js";
import { getAdminApp } from "../firebaseAdmin.js";
import { checkSignIn } from "./checkSignIn.js";

// A request carrying a sign-in token, the way the browser sends it.
function requestWith(token?: string): Request {
  return apiRequest("GET", "/x", { token });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("checkSignIn", () => {
  it("accepts a verified BC account and returns who it is", async () => {
    const token = await signInTestUser("ada@bc.edu", "Ada");
    const result = await checkSignIn(requestWith(token));
    expect(result).toEqual({
      ok: true,
      data: { email: "ada@bc.edu", name: "Ada" },
    });
  });

  it("leaves the name out, instead of filling in the email, when the account has none", async () => {
    const token = await signInTestUser("no-name@bc.edu");
    const result = await checkSignIn(requestWith(token));
    expect(result).toEqual({ ok: true, data: { email: "no-name@bc.edu" } });
  });

  it("turns away a request with no sign-in", async () => {
    const result = await checkSignIn(requestWith());
    expect(result).toEqual({
      ok: false,
      reason: "unauthenticated",
      message: "You must be signed in to do that.",
    });
  });

  it("turns away a made-up token", async () => {
    const result = await checkSignIn(requestWith("forged"));
    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.reason).toBe("unauthenticated");
  });

  it("turns away a real token sent without the exact 'Bearer ' prefix", async () => {
    const token = await signInTestUser("ada@bc.edu", "Ada");
    const request = new Request("http://test/x", {
      headers: { authorization: `Bearer:${token}` },
    });
    const result = await checkSignIn(request);
    expect(result.ok ? undefined : result.reason).toBe("unauthenticated");
  });

  it.each([
    ["a Google account outside BC", "someone@gmail.com", true],
    ["an unverified @bc.edu address", "unverified@bc.edu", false],
  ])("turns away %s", async (_label, email, verified) => {
    const token = await signInTestUser(email, "Someone", { verified });
    const result = await checkSignIn(requestWith(token));
    expect(result).toEqual({
      ok: false,
      reason: "forbidden",
      message: "Sign in with your BC account.",
    });
  });

  it("says the session ended when someone's sessions were revoked", async () => {
    const email = `removed-${Date.now()}@bc.edu`;
    const token = await signInTestUser(email, "Removed");
    // Revocation counts whole seconds, so let the token's sign-in time pass first.
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const auth = getAuth(getAdminApp());
    await auth.revokeRefreshTokens((await auth.getUserByEmail(email)).uid);

    const result = await checkSignIn(requestWith(token));
    expect(result).toEqual({
      ok: false,
      reason: "unauthenticated",
      message:
        "Your session ended because your access changed. Please sign in again.",
    });
  });

  it("refuses everyone on a production server that points at the Auth emulator", async () => {
    // These tests run with FIREBASE_AUTH_EMULATOR_HOST set; pretend this is production.
    vi.stubEnv("NODE_ENV", "production");
    const logged = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const token = await signInTestUser("ada@bc.edu", "Ada");

    const result = await checkSignIn(requestWith(token));
    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.reason).toBe("internal");
    expect(logged).toHaveBeenCalledWith(
      expect.stringContaining(
        "FIREBASE_AUTH_EMULATOR_HOST is set on a production server",
      ),
    );
  });
});
