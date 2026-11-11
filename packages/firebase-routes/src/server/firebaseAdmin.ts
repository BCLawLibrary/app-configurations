import { getApp, getApps, initializeApp, type App } from "firebase-admin/app";

// The app's one connection to Firebase on the server. The package uses it to
// check sign-ins; an app's store files use it to reach Firestore.
export function getAdminApp(): App {
  return getApps().length > 0 ? getApp() : initializeApp();
}
