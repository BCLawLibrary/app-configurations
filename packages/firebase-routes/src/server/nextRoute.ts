// The two shapes Next.js uses for route handlers.

// The second thing Next.js passes to a route handler. `params` holds the
// values from the URL's [folders], like the id in /api/todos/[id].
export type RouteContext = { params: Promise<unknown> };

// A route handler: what a route.ts file exports as GET, POST, and so on.
export type RouteHandler = (
  request: Request,
  context: RouteContext,
) => Promise<Response>;
