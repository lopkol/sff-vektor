import type z from "zod";
import { validator } from "hono/validator";
import type { Context } from "hono";
import { ValidationException } from "@sffvektor/lib";

export function validateBody(schema: z.ZodSchema) {
  return validator("form", async (_, c: Context) => {
    const parsed = await schema.safeParseAsync(await c.req.json());
    if (!parsed.success) {
      throw new ValidationException(parsed.error);
    }
    return parsed.data;
  });
}

export function validateQuery(schema: z.ZodSchema) {
  return validator("query", async (_, c: Context) => {
    const parsed = await schema.safeParseAsync(c.req.query());
    if (!parsed.success) {
      throw new ValidationException(parsed.error);
    }
    return parsed.data;
  });
}

export function validateParams(schema: z.ZodSchema) {
  return validator("param", async (_, c: Context) => {
    const parsed = await schema.safeParseAsync(c.req.param());
    if (!parsed.success) {
      throw new ValidationException(parsed.error);
    }
    return parsed.data;
  });
}
