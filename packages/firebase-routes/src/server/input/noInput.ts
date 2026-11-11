import * as z from "zod";

// For a route that takes no input. Every route names its input, so "none" is
// always said on purpose.
export const noInput = z.object({});
