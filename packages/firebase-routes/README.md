# @bclawlibrary/firebase-routes

The standard way BC Law Next.js apps build their API routes. Every route only answers signed-in BC users (Google sign-in, through Firebase), and the package includes the browser code to sign in and call those routes.

It has three parts:

| Import from | Used by | What's in it |
|---|---|---|
| `@bclawlibrary/firebase-routes/server` | `route.ts` files and operations | `defineRoute`, `ok`, `fail`, `anyBcUser`, `noInput`, `getAdminApp` |
| `@bclawlibrary/firebase-routes/client` | hooks and components | `callApi`, `signIn`, `useSignedInUser`, `useSignOut` |
| `@bclawlibrary/firebase-routes/testing` | tests only | `signInTestUser`, `apiRequest`, `routeParams` (need the Firebase emulators) |

## A route

```ts
// src/app/api/todos/route.ts
import { anyBcUser, defineRoute } from "@bclawlibrary/firebase-routes/server";
import { createTodo } from "@/server/todos/createTodo/createTodo";
import { CreateTodoInput } from "@/server/todos/createTodo/createTodo.schema";
import { TodoOutput } from "@/server/todos/todo.schema";

export const POST = defineRoute({
  allow: anyBcUser,        // who may use it
  input: CreateTodoInput,  // what the operation receives
  output: TodoOutput,      // what the caller gets back
  run: createTodo,         // the operation
  status: 201,             // optional, defaults to 200
});
```

For each request, `defineRoute` does these steps in order:

1. **Checks the sign-in.** Not signed in → 401. Not a verified `@bc.edu` Google account → 403.
2. **Asks `allow`.** No → 403, before the input is even read.
3. **Reads and checks the input.** It combines the query string, the JSON body and the URL's `[id]`-style values, and checks them against `input`. Invalid → 400 with what's wrong. Values from the URL always win, so a body can't swap in a different id.
4. **Runs the operation** with the signed-in person and the checked input.
5. **Sends back only the fields `output` names.** Anything else the operation returned is dropped.

Every response tells caches never to keep it. If anything crashes, the caller gets a plain 500 and the details go to the log.

## Who may use a route: `allow`

Every route must say. Use `anyBcUser` for "everyone at BC", or write a rule in the feature:

```ts
// src/server/rooms/rules/isRoomAdmin.ts
export async function isRoomAdmin(currentUser: CurrentUser): Promise<boolean> {
  const admins = await listRoomAdmins();
  return admins.includes(currentUser.email);
}
```

`allow` answers "may this person use this route at all?" Checks that need a record ("is this your todo?") belong in the operation, which returns `fail("forbidden", "…")`.

## Operations

An operation receives the signed-in person and the checked input, and returns `ok(data)` or `fail(reason, message)`. The message is shown to the person, so write it for them.

```ts
export async function getTodo(currentUser: CurrentUser, input: TodoIdParams) {
  const todo = await findTodo(input.id);
  if (!todo) return fail("not_found", "That todo doesn't exist.");
  if (todo.owner !== currentUser.email) return fail("forbidden", "That todo isn't yours.");
  return ok(todo);
}
```

`currentUser.name` may be missing (Firebase doesn't promise one), so decide what to show without it, usually `currentUser.name ?? currentUser.email`.

Routes that take no input say `input: noInput`.

## Calling routes from the browser

```ts
const todos = await callApi({ path: "/api/todos", query: { status: "open" }, output: TodoListOutput });
```

`callApi` sends the person's sign-in, checks the answer against `output`, and throws an `Error` with the route's message when the route says no (its `cause` is the HTTP status). With Next's `typedRoutes` setting on, a mistyped path is a type error.

`signIn()` opens Google sign-in. `useSignedInUser()` says who is signed in. `useSignOut()` signs out and clears loaded data, for shared computers.

## Rules

- **No public routes.** Every route needs a signed-in BC user. There's no way to build one that doesn't.
- **No hand-written handlers.** Build every `GET`, `POST`, etc. with `defineRoute`. Each app's every-route test uses `isBuiltByPackage` to fail on anything else.
- **Never set `FIREBASE_AUTH_EMULATOR_HOST` on a real server.** With it set, Firebase accepts fake sign-ins, so the package refuses every request in production when it's there.

## Setting up an app

The template repository already does this. By hand:

- Install `@bclawlibrary/firebase-routes`, plus `next`, `react`, `zod`, `firebase`, `firebase-admin` and `@tanstack/react-query`.
- In `vitest.config.mts`, add `test: { server: { deps: { inline: ["@bclawlibrary/firebase-routes"] } } }`. The package imports `next/navigation` the way Next expects, which Node can't find on its own.
- In `package.json`, add `"allowScripts": { "@firebase/util": true }`, so App Hosting can fill in Firebase's browser settings.
- For local work, `.env.development` sets `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR=http://127.0.0.1:9099` and `NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-<app>`.

## Inside the package

```
src/
  server/
    defineRoute.ts            a route for signed-in BC users
    result.ts                 ok() and fail()
    firebaseAdmin.ts          the one server-side Firebase connection
    builtRoutes.ts            remembers which handlers the package built
    nextRoute.ts              the shapes Next.js uses for route handlers
    access/                   who is calling, and may they?
    input/                    what did they send?
    output/                   what goes back?
  client/                     callApi, signIn/
  testing/                    helpers for tests (emulators only)
```

Each part has its tests next to it. `npm test` runs them against the Firebase Auth emulator.
