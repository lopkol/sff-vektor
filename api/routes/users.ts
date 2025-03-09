import z from "zod";
import { validator } from "hono/validator";
import { app } from "@/config/application.ts";
import {
  createUser,
  getOrCreateDatabasePool,
  getUserByEmail,
  getUserById,
  updateUser,
  UserRole,
} from "@sffvektor/lib";

// TODO: error handling

const createUserSchema = z.object({
  email: z.string(),
  name: z.string().optional(),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean(),
  molyUsername: z.string().optional(),
  molyUrl: z.string().optional(),
}).strict().refine((data) => {
  return ((data.molyUsername && data.molyUrl) ||
    (!data.molyUsername && !data.molyUrl));
}, {
  message: "Both molyUsername and molyUrl must be set if one of them is set",
  path: ["molyUsername", "molyUrl"],
});

const updateUserSchema = z.object({
  email: z.string().optional(),
  name: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  molyUsername: z.string().optional(),
  molyUrl: z.string().optional(),
}).strict();

app.get("/api/users", async (c) => {
  const email = c.req.query("email");
  if (!email) {
    return c.text("Email missing!", 400);
  }
  const pool = await getOrCreateDatabasePool();
  return c.json(await getUserByEmail(pool, email), 200);
});

app.get("/api/users/:id", async (c) => {
  const pool = await getOrCreateDatabasePool();
  return c.json(await getUserById(pool, c.req.param("id")), 200);
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
    const { email, name, role, isActive, molyUsername, molyUrl } = c.req.valid(
      "form",
    );
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
      201,
    );
  },
);

app.patch(
  "/api/users/:id",
  validator("form", async (_, c) => {
    const parsed = updateUserSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(parsed.error, 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { email, name, role, isActive, molyUsername, molyUrl } = c.req.valid(
      "form",
    );
    const pool = await getOrCreateDatabasePool();
    return c.json(
      await updateUser(pool, c.req.param("id"), {
        email,
        name,
        role,
        isActive,
        molyUsername,
        molyUrl,
      }),
      201,
    );
  },
);
