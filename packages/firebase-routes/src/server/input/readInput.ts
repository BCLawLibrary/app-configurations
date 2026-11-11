import * as z from "zod";
import type { RouteContext } from "../nextRoute.js";
import { fail, ok, type Result } from "../result.js";
import type { Schema } from "../../schema.js";

// Any object whose keys are text. Used to make sure the body and URL values
// are objects before they're combined.
const AnyObject = z.record(z.string(), z.unknown());

const NOT_A_JSON_OBJECT = "The request body must be a JSON object.";

// Reads everything the caller sent (query string, JSON body, URL values),
// checks it against the route's input schema, and returns only the fields the
// schema names. URL values go last, so a body or query string can never
// replace the id in the URL.
export async function readInput<Input>(
  request: Request,
  context: RouteContext,
  schema: Schema<Input>,
): Promise<Result<Input>> {
  const body = await readBody(request);
  if (!body.ok) return body;

  const query = Object.fromEntries(new URL(request.url).searchParams);
  const urlValues = AnyObject.safeParse(await context.params);
  const params = urlValues.success ? urlValues.data : {};

  const checked = schema.safeParse({ ...query, ...body.data, ...params });
  if (checked.success) return ok(checked.data);

  const problems = checked.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );
  return fail("invalid", problems.join("; "));
}

// GET and HEAD requests have no body. Other requests may send no body, or a
// JSON object.
async function readBody(
  request: Request,
): Promise<Result<Record<string, unknown>>> {
  if (request.method === "GET" || request.method === "HEAD") return ok({});

  const text = await request.text();
  if (text === "") return ok({});

  const body = AnyObject.safeParse(parseJson(text));
  if (body.success) return ok(body.data);
  return fail("invalid", NOT_A_JSON_OBJECT);
}

// Returns undefined for text that isn't valid JSON.
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
