import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import * as z from "zod";
import { getAdminApp } from "../firebaseAdmin.js";
import { fail, ok, type Result } from "../result.js";
import type { CurrentUser } from "./currentUser.js";

const SIGNED_OUT = "You must be signed in to do that.";
const SESSION_ENDED =
  "Your session ended because your access changed. Please sign in again.";
const BC_ONLY = "Sign in with your BC account.";
const EMULATOR_IN_PRODUCTION =
  "FIREBASE_AUTH_EMULATOR_HOST is set on a production server, so sign-in tokens can't be trusted. Every signed-in request is refused until it is removed.";

// What Firebase reports when someone's sessions were ended on purpose (for
// example, an admin removed them).
const RevokedError = z.object({ code: z.literal("auth/id-token-revoked") });

// Works out who sent a request, from its "Authorization: Bearer <token>"
// header. Only verified @bc.edu accounts get through.
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

  const email = (account.data.email ?? "").toLowerCase();
  if (account.data.email_verified !== true || !email.endsWith("@bc.edu")) {
    return fail("forbidden", BC_ONLY);
  }

  const name: unknown = account.data.name;
  if (typeof name === "string" && name !== "") return ok({ email, name });
  return ok({ email });
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

// Asks Firebase whether the token is real, unexpired and not revoked.
async function checkToken(token: string): Promise<Result<DecodedIdToken>> {
  try {
    const checkRevoked = true;
    return ok(await getAuth(getAdminApp()).verifyIdToken(token, checkRevoked));
  } catch (error) {
    const revoked = RevokedError.safeParse(error).success;
    return fail("unauthenticated", revoked ? SESSION_ENDED : SIGNED_OUT);
  }
}
