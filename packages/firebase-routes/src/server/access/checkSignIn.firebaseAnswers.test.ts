import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../../testing/apiRequest.js";
import { checkSignIn } from "./checkSignIn.js";

// Firebase can't hand out an old sign-in or a tenant sign-in on demand, so
// these tests replace its token check with answers written here.
const firebase = vi.hoisted(() => ({
  answer: async (): Promise<unknown> => ({}),
}));
vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({ verifyIdToken: () => firebase.answer() }),
}));

const DAY = 24 * 60 * 60;
const nowInSeconds = () => Math.floor(Date.now() / 1000);

// What Firebase reports for Ada signing in with Google `daysAgo` days ago.
function googleSignIn(daysAgo: number, firebaseDetails: object = {}) {
  return {
    email: "ada@bc.edu",
    email_verified: true,
    name: "Ada",
    auth_time: nowInSeconds() - daysAgo * DAY,
    firebase: { sign_in_provider: "google.com", ...firebaseDetails },
  };
}

const request = () => apiRequest("GET", "/x", { token: "a-token" });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkSignIn, given answers from Firebase", () => {
  it("accepts a Google sign-in from 4 days ago", async () => {
    firebase.answer = async () => googleSignIn(4);
    const result = await checkSignIn(request());
    expect(result).toEqual({
      ok: true,
      data: { email: "ada@bc.edu", name: "Ada" },
    });
  });

  it("asks for a new sign-in once the last Google sign-in is over 5 days old", async () => {
    firebase.answer = async () => googleSignIn(5.01);
    const result = await checkSignIn(request());
    expect(result).toEqual({
      ok: false,
      reason: "unauthenticated",
      message: "Your sign-in has expired. Please sign in again.",
    });
  });

  it("turns away a sign-in that belongs to an Identity Platform tenant", async () => {
    firebase.answer = async () => googleSignIn(0, { tenant: "some-tenant" });
    const result = await checkSignIn(request());
    expect(result.ok ? undefined : result.reason).toBe("forbidden");
  });

  it("treats an expired token as the person's problem: sign in again", async () => {
    firebase.answer = async () => {
      throw { code: "auth/id-token-expired" };
    };
    const result = await checkSignIn(request());
    expect(result).toEqual({
      ok: false,
      reason: "unauthenticated",
      message: "You must be signed in to do that.",
    });
  });

  it("treats Firebase or network failures as our problem: logged, and a 500", async () => {
    const logged = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    firebase.answer = async () => {
      throw new Error("getaddrinfo ENOTFOUND www.googleapis.com");
    };
    const result = await checkSignIn(request());
    expect(result.ok ? undefined : result.reason).toBe("internal");
    expect(logged).toHaveBeenCalled();
  });
});
