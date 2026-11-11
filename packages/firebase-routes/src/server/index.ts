// Everything an app's server code imports from @bclawlibrary/firebase-routes/server.

// Building routes
export { defineRoute } from "./defineRoute.js";
export { noInput } from "./input/noInput.js";

// Who may use a route
export { anyBcUser, type Allow } from "./access/allow.js";
export type { CurrentUser } from "./access/currentUser.js";

// What operations return
export { ok, fail, type Result } from "./result.js";

// Firebase on the server (for an app's store files)
export { getAdminApp } from "./firebaseAdmin.js";

// For an app's "every route is built by this package" test
export { isBuiltByPackage } from "./builtRoutes.js";
