import { unstable_rethrow } from "next/navigation";
import { fail } from "../result.js";
import { sendFailure } from "./sendResult.js";

// Runs a route's work. If anything crashes, the error is logged and the caller
// gets a plain 500, so no details (like a database message) ever reach them.
export async function catchCrashes(
  work: () => Promise<Response>,
): Promise<Response> {
  try {
    return await work();
  } catch (error) {
    // Next.js signals some things (like "build this page on each request") by
    // throwing. Those must pass through untouched.
    unstable_rethrow(error);
    console.error("A route crashed:", error);
    return sendFailure(fail("internal", "Something went wrong."));
  }
}
