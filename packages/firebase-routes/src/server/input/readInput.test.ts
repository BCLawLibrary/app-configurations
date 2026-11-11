import { describe, expect, it } from "vitest";
import * as z from "zod";
import { apiRequest } from "../../testing/apiRequest.js";
import { routeParams } from "../../testing/routeParams.js";
import { readInput } from "./readInput.js";

// Like a route for /api/todos/[id]: the id comes from the URL, the title from the body.
const UpdateInput = z.object({ id: z.string(), title: z.string().min(1) });

function rawPost(body: string): Request {
  return new Request("http://test/x", { method: "POST", body });
}

describe("readInput", () => {
  it("combines the URL values and the body, keeping only the fields the schema names", async () => {
    const request = apiRequest("POST", "/x", {
      body: { title: "Buy milk", extra: "dropped" },
    });
    const result = await readInput(
      request,
      routeParams({ id: "1" }),
      UpdateInput,
    );
    expect(result).toEqual({ ok: true, data: { id: "1", title: "Buy milk" } });
  });

  it("never lets the body or the query string replace the id in the URL", async () => {
    const request = apiRequest("POST", "/x?id=from-query", {
      body: { title: "a", id: "someone-elses" },
    });
    const result = await readInput(
      request,
      routeParams({ id: "1" }),
      UpdateInput,
    );
    expect(result).toEqual({ ok: true, data: { id: "1", title: "a" } });
  });

  it("reads a GET request's query string", async () => {
    const ListInput = z.object({ status: z.enum(["open", "done"]) });
    const request = apiRequest("GET", "/x?status=open");
    const result = await readInput(request, routeParams(), ListInput);
    expect(result).toEqual({ ok: true, data: { status: "open" } });
  });

  it("accepts a request with no body at all", async () => {
    const request = new Request("http://test/x", { method: "DELETE" });
    const IdOnly = z.object({ id: z.string() });
    const result = await readInput(request, routeParams({ id: "1" }), IdOnly);
    expect(result).toEqual({ ok: true, data: { id: "1" } });
  });

  it("explains which field is wrong", async () => {
    const request = apiRequest("POST", "/x", { body: { title: "" } });
    const result = await readInput(
      request,
      routeParams({ id: "1" }),
      UpdateInput,
    );
    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.reason).toBe("invalid");
    expect(result.ok ? undefined : result.message).toContain("title");
  });

  it.each([
    ["text that isn't JSON", "not json"],
    ["JSON that isn't an object", '["a"]'],
  ])("turns away a body of %s", async (_label, body) => {
    const result = await readInput(
      rawPost(body),
      routeParams({ id: "1" }),
      UpdateInput,
    );
    expect(result).toEqual({
      ok: false,
      reason: "invalid",
      message: "The request body must be a JSON object.",
    });
  });
});
