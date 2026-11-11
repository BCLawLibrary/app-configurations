import type { CurrentUser } from "./currentUser.js";

// A rule that decides who may use a route, written by the app (for example
// isRoomAdmin). Checks that need a record, like "is this your todo?", stay in
// the operation instead.
export type Allow = (currentUser: CurrentUser) => Promise<boolean>;

// The one built-in rule: every signed-in, verified BC account.
export async function anyBcUser(): Promise<boolean> {
  return true;
}
