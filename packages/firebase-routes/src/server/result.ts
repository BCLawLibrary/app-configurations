// What every operation returns: ok(data) when it worked, or fail(reason, message)
// when it didn't. The message is shown to the person, so write it for them.

export type Reason =
  | "invalid"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "too_large"
  | "internal";

export type Failure = { ok: false; reason: Reason; message: string };

export type Result<Data> = { ok: true; data: Data } | Failure;

export function ok<Data>(data: Data): Result<Data> {
  return { ok: true, data };
}

export function fail(reason: Reason, message: string): Failure {
  return { ok: false, reason, message };
}
