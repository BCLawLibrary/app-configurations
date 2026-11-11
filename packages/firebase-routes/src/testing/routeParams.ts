// Builds the second argument Next.js passes to a route handler.
export function routeParams(params: Record<string, string> = {}) {
  return { params: Promise.resolve(params) };
}
