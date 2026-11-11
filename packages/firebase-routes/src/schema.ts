import type * as z from "zod";

// A Zod schema that checks data and produces a value of type Data. For
// example, Schema<{ title: string }> checks for an object with a text title.
export type Schema<Data> = z.ZodType<Data>;
