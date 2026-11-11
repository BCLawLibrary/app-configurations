// Builds the Request a route handler receives, for use in tests.
export function apiRequest(
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {},
): Request {
  const auth = options.token
    ? { authorization: `Bearer ${options.token}` }
    : undefined;
  const json =
    options.body === undefined ? undefined : JSON.stringify(options.body);
  return new Request(`http://test${path}`, {
    method,
    headers: { "content-type": "application/json", ...auth },
    body: json,
  });
}
