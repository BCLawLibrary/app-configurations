import { fail, type Failure, type Reason, type Result } from "../result.js";
import type { Schema } from "../../schema.js";

// The HTTP status sent for each kind of failure.
const STATUS: Record<Reason, number> = {
  invalid: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  too_large: 413,
  internal: 500,
};

// Responses can hold someone's data, so no cache (App Hosting's CDN, or the
// browser on a shared computer) may ever keep them.
const NEVER_CACHE = { "Cache-Control": "private, no-store" };

// Sends an operation's result back to the caller. On success, only the fields
// the output schema names are sent; anything else the operation returned is dropped.
export function sendResult(
  result: Result<unknown>,
  output: Schema<unknown>,
  status: number,
): Response {
  if (!result.ok) return sendFailure(result);

  const checked = output.safeParse(result.data);
  if (!checked.success) {
    console.error(
      "A route returned data that doesn't match its output schema:",
      checked.error.issues,
    );
    return sendFailure(fail("internal", "Something went wrong."));
  }

  return Response.json(checked.data, { status, headers: NEVER_CACHE });
}

// Sends a failure as { "error": message } with the matching status.
export function sendFailure(failure: Failure): Response {
  return Response.json(
    { error: failure.message },
    { status: STATUS[failure.reason], headers: NEVER_CACHE },
  );
}
