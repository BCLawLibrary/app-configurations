import { afterEach, describe, expect, it, vi } from "vitest";
import * as z from "zod";
import { fail, ok } from "../result.js";
import { sendResult } from "./sendResult.js";

const Output = z.object({ saved: z.boolean() });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sendResult", () => {
  it("sends only the fields the output schema names, with the route's status", async () => {
    const response = sendResult(
      ok({ saved: true, internalNote: "staff only" }),
      Output,
      201,
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ saved: true });
  });

  it("answers 500, without the data, when the result doesn't match the output schema", async () => {
    const logged = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const response = sendResult(
      ok({ saved: "yes", internalNote: "staff only" }),
      Output,
      200,
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Something went wrong." });
    expect(logged).toHaveBeenCalled();
  });

  it.each([
    ["invalid", 400],
    ["unauthenticated", 401],
    ["forbidden", 403],
    ["not_found", 404],
    ["internal", 500],
  ] as const)(
    "sends a %s failure as %i with its message",
    async (reason, status) => {
      const response = sendResult(
        fail(reason, "Explained for people."),
        Output,
        200,
      );
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({ error: "Explained for people." });
    },
  );

  it("tells every cache never to keep a response, success or failure", () => {
    const success = sendResult(ok({ saved: true }), Output, 200);
    const failure = sendResult(fail("forbidden", "No."), Output, 200);
    expect(success.headers.get("cache-control")).toBe("private, no-store");
    expect(failure.headers.get("cache-control")).toBe("private, no-store");
  });
});
