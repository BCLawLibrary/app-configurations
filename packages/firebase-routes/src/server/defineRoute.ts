import type { Allow } from "./access/allow.js";
import { checkSignIn } from "./access/checkSignIn.js";
import type { CurrentUser } from "./access/currentUser.js";
import { readInput } from "./input/readInput.js";
import type { RouteContext } from "./nextRoute.js";
import { catchCrashes } from "./output/catchCrashes.js";
import { sendFailure, sendResult } from "./output/sendResult.js";
import { fail, type Result } from "./result.js";
import type { Schema } from "../schema.js";
import { rememberRoute } from "./builtRoutes.js";

const NOT_ALLOWED = "You don't have permission to do that.";

type RouteSettings<Input, Output> = {
  // Who may use this route. Use anyBcUser for "everyone at BC".
  allow: Allow;
  // Everything the operation receives: URL values, query string and JSON body.
  input: Schema<Input>;
  // What the caller gets back. Fields not named here are never sent.
  output: Schema<Output>;
  // The HTTP status on success. Defaults to 200.
  status?: number;
  // The operation that does the work. NoInfer makes TypeScript take Output from
  // the output schema only, so an operation that returns too little is an error.
  run: (
    currentUser: CurrentUser,
    input: Input,
  ) => Promise<Result<NoInfer<Output>>>;
};

// Builds a route for signed-in BC users. For each request, in order:
//   1. check the sign-in           (not signed in → 401, not a BC account → 403)
//   2. ask the route's allow rule  (no → 403, before the input is even read)
//   3. read and check the input    (invalid → 400)
//   4. run the operation
//   5. send back only the fields the output schema names
export function defineRoute<Input, Output>(
  route: RouteSettings<Input, Output>,
) {
  const status = route.status ?? 200;

  async function handler(
    request: Request,
    context: RouteContext,
  ): Promise<Response> {
    return catchCrashes(async () => {
      const user = await checkSignIn(request);
      if (!user.ok) return sendFailure(user);

      const allowed = await route.allow(user.data);
      if (!allowed) return sendFailure(fail("forbidden", NOT_ALLOWED));

      const input = await readInput(request, context, route.input);
      if (!input.ok) return sendFailure(input);

      const result = await route.run(user.data, input.data);
      return sendResult(result, route.output, status);
    });
  }

  return rememberRoute(handler);
}
