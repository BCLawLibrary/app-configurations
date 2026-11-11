import type { RouteHandler } from "./nextRoute.js";

// Every route handler this package has built. An app's "every route" test uses
// this to catch hand-written handlers, which would skip the sign-in check.
const builtRoutes = new WeakSet<object>();

export function rememberRoute(handler: RouteHandler): RouteHandler {
  builtRoutes.add(handler);
  return handler;
}

export function isBuiltByPackage(handler: unknown): boolean {
  return typeof handler === "function" && builtRoutes.has(handler);
}
