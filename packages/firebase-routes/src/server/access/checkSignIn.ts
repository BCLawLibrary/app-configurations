import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import * as z from "zod";
import { BC_DOMAIN } from "../../bcDomain.js";
import { getAdminApp } from "../firebaseAdmin.js";
import { fail, ok, type Result } from "../result.js";
import type { CurrentUser } from "./currentUser.js";

const SIGNED_OUT = "You must be signed in to do that.";
const SESSION_ENDED =
  "Your session ended because your access changed. Please sign in again.";
const SIGN_IN_TOO_OLD = "Your sign-in has expired. Please sign in again.";
const BC_ONLY = "Sign in with your BC account.";
const EMULATOR_IN_PRODUCTION =
  "FIREBASE_AUTH_EMULATOR_HOST is set on a production server, so sign-in tokens can't be trusted. Every signed-in request is refused until it is removed.";

// How long a Google sign-in stays good. After this, the person signs in with
// Google again, so someone whose BC account was suspended can't get back in.
const MAX_SIGN_IN_AGE_SECONDS = 5 * 24 * 60 * 60; // 5 days

// The reasons Firebase gives for a sign-in token that isn't good enough. Any
// other error means something went wrong on our side, not the person's.
const BadSignIn = z.object({
  code: z.enum([
    "auth/id-token-expired",
    "auth/argument-error",
    "auth/id-token-revoked",
    "auth/user-disabled",
    "auth/user-not-found",
  ]),
});

// Works out who sent a request, from its "Authorization: Bearer <token>"
// header. Only people who signed in with a verified @bc.edu Google account in
// the last 5 days get through.
export async function checkSignIn(
  request: Request,
): Promise<Result<CurrentUser>> {
  if (emulatorOnProductionServer()) {
    console.error(EMULATOR_IN_PRODUCTION);
    return fail("internal", "Something went wrong.");
  }

  const token = readToken(request);
  if (token === undefined) return fail("unauthenticated", SIGNED_OUT);

  const account = await checkToken(token);
  if (!account.ok) return account;

  if (signedInTooLongAgo(account.data)) {
    return fail("unauthenticated", SIGN_IN_TOO_OLD);
  }
  if (!isBcGoogleAccount(account.data)) return fail("forbidden", BC_ONLY);

  const email = (account.data.email ?? "").toLowerCase();
  const name: unknown = account.data.name;
  if (typeof name === "string" && name !== "") return ok({ email, name });
  return ok({ email });
}

// A verified @bc.edu address, signed in with Google itself (not another
// provider that merely claims a BC address), in the app's own Firebase project.
function isBcGoogleAccount(account: DecodedIdToken): boolean {
  const email = (account.email ?? "").toLowerCase();
  const verified = account.email_verified === true;
  const bcAddress = email.endsWith(`@${BC_DOMAIN}`);
  const viaGoogle = account.firebase.sign_in_provider === "google.com";
  const noTenant = account.firebase.tenant === undefined;
  return verified && bcAddress && viaGoogle && noTenant;
}

// auth_time is when the person last actually signed in with Google. Firebase
// keeps it the same when it quietly renews a token, so this is the real age.
function signedInTooLongAgo(account: DecodedIdToken): boolean {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return nowSeconds - account.auth_time > MAX_SIGN_IN_AGE_SECONDS;
}

// With this variable set, Firebase accepts the emulator's unsigned tokens, so
// anyone could forge a sign-in. Fine on a laptop, never on a real server.
function emulatorOnProductionServer(): boolean {
  const onProduction = process.env.NODE_ENV === "production";
  const usesEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
  return onProduction && usesEmulator;
}

// The token after "Bearer " in the Authorization header, if there is one.
function readToken(request: Request): string | undefined {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return undefined;

  const token = header.slice("Bearer ".length);
  return token === "" ? undefined : token;
}

// Asks Firebase whether the token is real, unexpired and not revoked. A bad
// token is the person's problem (401); anything else is ours (logged, 500).
async function checkToken(token: string): Promise<Result<DecodedIdToken>> {
  try {
    const checkRevoked = true;
    return ok(await getAuth(getAdminApp()).verifyIdToken(token, checkRevoked));
  } catch (error) {
    const bad = BadSignIn.safeParse(error);
    if (!bad.success) {
      console.error("Couldn't check a sign-in token:", error);
      return fail("internal", "Something went wrong.");
    }
    const revoked = bad.data.code === "auth/id-token-revoked";
    return fail("unauthenticated", revoked ? SESSION_ENDED : SIGNED_OUT);
  }
}
