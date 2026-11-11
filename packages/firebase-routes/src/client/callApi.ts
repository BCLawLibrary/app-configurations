import { getIdToken } from "firebase/auth";
import type { Route } from "next";
import * as z from "zod";
import type { Schema } from "../schema.js";
import { firebaseAuth } from "./signIn/firebaseAuth.js";

type ApiCall<Path extends string, Output> = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  // The path of an API route that exists in this app, like /api/todos. With
  // Next's typedRoutes setting on, a mistyped path is a type error.
  path: Route<Path> & `/api/${string}`;
  // Added to the URL, like ?status=open. Values left undefined are skipped.
  query?: Record<string, string | undefined>;
  // Sent as JSON.
  body?: unknown;
  // What the route sends back. The answer is checked against it.
  output: Schema<Output>;
};

// How a route describes a failure.
const ErrorBody = z.object({ error: z.string() });

// The only code in the browser that talks to the app's API. It sends the
// person's sign-in and checks the answer against `output`. If the route says
// no, it throws an Error with the route's message, and the HTTP status as its
// `cause`, so retry settings can tell a "no" from a server error.
export async function callApi<Path extends string, Output>(
  call: ApiCall<Path, Output>,
): Promise<Output> {
  const hasBody = call.body !== undefined;
  const response = await fetch(urlWithQuery(call.path, call.query), {
    method: call.method ?? "GET",
    headers: await requestHeaders(hasBody),
    body: hasBody ? JSON.stringify(call.body) : undefined,
  });

  const answer: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(failureMessage(answer), { cause: response.status });
  }
  return call.output.parse(answer);
}

// The person's sign-in token (when someone is signed in), and the body's format.
async function requestHeaders(
  hasBody: boolean,
): Promise<Record<string, string>> {
  const auth = firebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  const token = user ? await getIdToken(user) : undefined;

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
  };
}

// Adds the query values that are set, like /api/todos?status=open.
function urlWithQuery(
  path: string,
  query: Record<string, string | undefined> = {},
): string {
  const setValues = Object.entries(query).flatMap(([key, value]) =>
    value === undefined ? [] : [[key, value]],
  );
  if (setValues.length === 0) return path;
  return `${path}?${new URLSearchParams(setValues)}`;
}

// The route's own message (written for people), or a general one.
function failureMessage(answer: unknown): string {
  const failure = ErrorBody.safeParse(answer);
  return failure.success ? failure.data.error : "Something went wrong.";
}
