import { app } from "@/config/application.ts";
import {
  createUser,
  createUserSchema,
  EntityNotFoundException,
  getAllUsers,
  getOrCreateDatabasePool,
  getUserById,
  InvalidArgumentException,
  UniqueConstraintException,
  updateUser,
  updateUserSchema,
} from "@sffvektor/lib";
import { createFormValidator } from "@/middlewares/validator.ts";

const createUserApiSchema = createUserSchema.strict();

const updateUserApiSchema = updateUserSchema.strict();

app.get("/api/users", async (c) => {
  const pool = await getOrCreateDatabasePool();
  try {
    return c.json(await getAllUsers(pool), 200);
  } catch (error) {
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
  createFormValidator(createUserApiSchema),
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
  createFormValidator(updateUserApiSchema),
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
