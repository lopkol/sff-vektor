import z from "zod";
import { app } from "@/config/application.ts";
import {
  createUser,
  EntityNotFoundException,
  getOrCreateDatabasePool,
  getUserByEmail,
  getUserById,
  InvalidArgumentException,
  UniqueConstraintException,
  updateUser,
  UserRole,
} from "@sffvektor/lib";
import { createFormValidator } from "@/middlewares/validator.ts";

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
  try {
    return c.json(await getUserByEmail(pool, email), 200);
  } catch (error) {
    if (error instanceof EntityNotFoundException) {
      return c.json({ message: error.message, details: error.details }, 404);
    }
    console.error(error);
    throw error;
  }
});

app.get("/api/users/:id", async (c) => {
  const pool = await getOrCreateDatabasePool();
  try {
    return c.json(await getUserById(pool, c.req.param("id")), 200);
  } catch (error) {
    if (error instanceof EntityNotFoundException) {
      return c.json({ message: error.message, details: error.details }, 404);
    }
    console.error(error);
    throw error;
  }
});

app.post(
  "/api/users",
  createFormValidator(createUserSchema),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    try {
      return c.json(
        await createUser(pool, c.req.valid("form")),
        201,
      );
    } catch (error) {
      if (error instanceof UniqueConstraintException) {
        return c.json({ message: error.message, details: error.details }, 400);
      }
      console.error(error);
      throw error;
    }
  },
);

app.patch(
  "/api/users/:id",
  createFormValidator(updateUserSchema),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    try {
      return c.json(
        await updateUser(pool, c.req.param("id"), c.req.valid("form")),
        201,
      );
    } catch (error) {
      if (
        error instanceof UniqueConstraintException ||
        error instanceof InvalidArgumentException
      ) {
        return c.json({ message: error.message, details: error.details }, 400);
      }
      if (error instanceof EntityNotFoundException) {
        return c.json({ message: error.message, details: error.details }, 404);
      }
      console.error(error);
      throw error;
    }
  },
);
