import { afterEach, describe, expect, it, vi } from "vitest";
import { catchCrashes } from "./catchCrashes.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("catchCrashes", () => {
  it("passes a normal response through", async () => {
    const response = await catchCrashes(async () =>
      Response.json({ fine: true }),
    );
    expect(await response.json()).toEqual({ fine: true });
  });

  it("answers a plain 500, without the details, when the work crashes", async () => {
    const logged = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const response = await catchCrashes(async () => {
      throw new Error("database password is hunter2");
    });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Something went wrong." });
    expect(logged).toHaveBeenCalled();
  });
});
