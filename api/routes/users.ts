import z from "zod";
import { validator } from "hono/validator";
import { app } from "@/config/application.ts";
import {
  UserRole,
  createUser,
  getOrCreateDatabasePool,
  getUserByEmail,
} from "@sffvektor/lib";

const createUserSchema = z.object({
  email: z.string(),
  name: z.string().optional(),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean(),
  molyUsername: z.string().optional(),
  molyUrl: z.string().optional(),
});

app.get("/api/users", async (c) => {
  const email = c.req.query("email");
  console.log(email);
  if (!email) {
    return c.text("Email missing!", 400);
  }
  const pool = await getOrCreateDatabasePool();
  return c.json(await getUserByEmail(pool, email), 200);
});

app.post(
  "/api/users",
  validator("form", async (_, c) => {
    const parsed = createUserSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(parsed.error, 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { email, name, role, isActive, molyUsername, molyUrl } =
      c.req.valid("form");
    const pool = await getOrCreateDatabasePool();
    return c.json(
      await createUser(pool, {
        email,
        name,
        role,
        isActive,
        molyUsername,
        molyUrl,
      }),
      201
    );
  }
);
