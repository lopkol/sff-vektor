import type z from "zod";
import { validator } from "hono/validator";
import type { Context } from "hono";

export function validateBody(schema: z.ZodSchema) {
  return validator("form", async (_, c: Context) => {
    const parsed = schema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(parsed.error, 400);
    }
    return parsed.data;
  });
}
