import { describe, expect, it, vi } from "vitest";
import * as z from "zod";
import { apiRequest } from "../testing/apiRequest.js";
import { routeParams } from "../testing/routeParams.js";
import { signInTestUser } from "../testing/signInTestUser.js";
import { anyBcUser } from "./access/allow.js";
import { defineRoute } from "./defineRoute.js";
import { ok } from "./result.js";
import { isBuiltByPackage } from "./builtRoutes.js";

// These tests check that defineRoute runs its steps in the right order. Each
// step's details are tested next to it (access/, input/, output/).

const Input = z.object({ id: z.string(), title: z.string().min(1) });
const Output = z.object({ saved: z.boolean() });

const ada = signInTestUser("ada@bc.edu", "Ada");

describe("defineRoute", () => {
  it("runs the operation with the signed-in person and their checked input", async () => {
    const run = vi.fn(async () =>
      ok({ saved: true, internalNote: "staff only" }),
    );
    const POST = defineRoute({
      allow: anyBcUser,
      input: Input,
      output: Output,
      run,
      status: 201,
    });

    const request = apiRequest("POST", "/x", {
      token: await ada,
      body: { title: "a" },
    });
    const response = await POST(request, routeParams({ id: "1" }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ saved: true });
    expect(run).toHaveBeenCalledWith(
      { email: "ada@bc.edu", name: "Ada" },
      { id: "1", title: "a" },
    );
  });

  it("never runs the operation for someone who isn't signed in", async () => {
    const run = vi.fn(async () => ok({ saved: true }));
    const POST = defineRoute({
      allow: anyBcUser,
      input: Input,
      output: Output,
      run,
    });

    const request = apiRequest("POST", "/x", { body: { title: "a" } });
    const response = await POST(request, routeParams({ id: "1" }));

    expect(response.status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it("asks the allow rule about the signed-in person, before even reading the input", async () => {
    const run = vi.fn(async () => ok({ saved: true }));
    const nobody = vi.fn(async () => false);
    const POST = defineRoute({
      allow: nobody,
      input: Input,
      output: Output,
      run,
    });

    // An invalid body: someone not allowed still gets 403, not a 400 describing the input.
    const request = apiRequest("POST", "/x", {
      token: await ada,
      body: { title: "" },
    });
    const response = await POST(request, routeParams({ id: "1" }));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "You don't have permission to do that.",
    });
    expect(nobody).toHaveBeenCalledWith({ email: "ada@bc.edu", name: "Ada" });
    expect(run).not.toHaveBeenCalled();
  });

  it("is recognized by the every-route check, and a hand-written handler is not", () => {
    const GET = defineRoute({
      allow: anyBcUser,
      input: Input,
      output: Output,
      run: async () => ok({ saved: true }),
    });
    async function handWritten() {
      return Response.json({ secret: "no sign-in check" });
    }
    expect(isBuiltByPackage(GET)).toBe(true);
    expect(isBuiltByPackage(handWritten)).toBe(false);
  });
});
