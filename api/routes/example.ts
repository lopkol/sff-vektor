import z from "zod";
import { validator } from "hono/validator";
import { getExample } from "@ssfvektor/lib";
import { app } from "@/config/application.ts";
import { pool } from "@/config/database.ts";

app.get("/", async (c) => {
  return c.json(await getExample(pool), 201);
});

const schema = z.object({
  message: z.string(),
});

app.post(
  "/",
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
