import z from "zod";
import { validator } from "hono/validator";
import { getExample, getOrCreateDatabasePool } from "@sffvektor/lib";
import { app } from "@/config/application.ts";

app.get("/api/example", async (c) => {
  const pool = await getOrCreateDatabasePool();
  return c.json(await getExample(pool), 201);
});

const schema = z.object({
  message: z.string(),
});

app.post(
  "/api/example",
  validator("form", (value, c) => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      return c.text("Invalid!", 400);
    }
    return parsed.data;
  }),
  (c) => {
    const { message } = c.req.valid("form");
    // ... do something
    return c.json(
      {
        message,
      },
      201
    );
  }
);
