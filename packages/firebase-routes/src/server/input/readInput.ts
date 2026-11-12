import * as z from "zod";
import type { RouteContext } from "../nextRoute.js";
import { fail, ok, type Result } from "../result.js";
import type { Schema } from "../../schema.js";

// Any object whose keys are text. Used to make sure the body and URL values
// are objects before they're combined.
const AnyObject = z.record(z.string(), z.unknown());

// The largest request body a route accepts: 1 MB.
const MAX_BODY_BYTES = 1_000_000;

const NOT_A_JSON_OBJECT = "The request body must be a JSON object.";
const BODY_TOO_LARGE = "The request body is too large.";
const SLASH_IN_URL_VALUE = "A value in the URL can't contain '/'.";

// Reads everything the caller sent, checks it against the route's input
// schema, and returns only the fields the schema names.
//   - GET and HEAD requests send their input in the query string (?status=open).
//   - Other requests send it as a JSON body.
//   - The URL's [folder] values, like the id in /api/todos/[id], always go last,
//     so nothing else can replace the id in the URL.
export async function readInput<Input>(
  request: Request,
  context: RouteContext,
  schema: Schema<Input>,
): Promise<Result<Input>> {
  const sent = await readQueryOrBody(request);
  if (!sent.ok) return sent;

  const urlValues = await readUrlValues(context);
  if (!urlValues.ok) return urlValues;

  const checked = schema.safeParse({ ...sent.data, ...urlValues.data });
  if (checked.success) return ok(checked.data);

  const problems = checked.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );
  return fail("invalid", problems.join("; "));
}

function readsQueryString(request: Request): boolean {
  return request.method === "GET" || request.method === "HEAD";
}

async function readQueryOrBody(
  request: Request,
): Promise<Result<Record<string, unknown>>> {
  if (readsQueryString(request)) {
    return ok(Object.fromEntries(new URL(request.url).searchParams));
  }
  return readBody(request);
}

// No body at all is fine. Otherwise it must be a JSON object of at most 1 MB.
async function readBody(
  request: Request,
): Promise<Result<Record<string, unknown>>> {
  const declaredSize = Number(request.headers.get("content-length") ?? "0");
  if (declaredSize > MAX_BODY_BYTES) return fail("too_large", BODY_TOO_LARGE);

  const text = await request.text();
  if (text === "") return ok({});
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return fail("too_large", BODY_TOO_LARGE);
  }

  const body = AnyObject.safeParse(parseJson(text));
  if (body.success) return ok(body.data);
  return fail("invalid", NOT_A_JSON_OBJECT);
}

// The URL's [folder] values. None may contain "/": an id is used as one piece
// of a database path, and an encoded "/" (%2F) would reach a different record.
async function readUrlValues(
  context: RouteContext,
): Promise<Result<Record<string, unknown>>> {
  const parsed = AnyObject.safeParse(await context.params);
  const values = parsed.success ? parsed.data : {};

  const hasSlash = Object.values(values)
    .flat()
    .some((value) => typeof value === "string" && value.includes("/"));
  if (hasSlash) return fail("invalid", SLASH_IN_URL_VALUE);

  return ok(values);
}

// Returns undefined for text that isn't valid JSON.
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
