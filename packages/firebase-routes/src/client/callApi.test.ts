import { afterEach, describe, expect, it, vi } from "vitest";
import * as z from "zod";
import { callApi } from "./callApi.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("callApi", () => {
  it.each([
    "https://other.site/api/todos",
    "//other.site/api/todos",
    "/\\other.site/api/todos",
    "/not-the-api/todos",
  ])("refuses to send anything to %s", async (path) => {
    const fetched = vi.spyOn(globalThis, "fetch");
    // The cast skips the type check on purpose: this is the mistake types can't
    // see, a path built from data while the app runs.
    const call = callApi({ path: path as "/api/x", output: z.object({}) });
    await expect(call).rejects.toThrow(
      "callApi only calls this app's own /api routes",
    );
    expect(fetched).not.toHaveBeenCalled();
  });
});
