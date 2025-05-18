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
import { validateBody } from "@/middlewares/validator.ts";
import { isUserAdminMiddleware } from "@/middlewares/role-check.ts";

const createUserApiSchema = createUserSchema.strict();

const updateUserApiSchema = updateUserSchema.strict();

app.get("/api/users", isUserAdminMiddleware, async (c) => {
  const pool = await getOrCreateDatabasePool();
  try {
    return c.json(await getAllUsers(pool), 200);
  } catch (error) {
    console.error(error);
    throw error;
  }
});

app.get("/api/users/:id", isUserAdminMiddleware, async (c) => {
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
  isUserAdminMiddleware,
  validateBody(createUserApiSchema),
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
  isUserAdminMiddleware,
  validateBody(updateUserApiSchema),
  async (c) => {
    const userId = c.req.param("id");
    const userParams = c.req.valid("form");

    // Users cannot deactivate themselves
    const currentUser = c.get("user");
    if (currentUser.id === userId && userParams.isActive === false) {
      return c.json({ message: "Cannot deactivate yourself" }, 400);
    }

    const pool = await getOrCreateDatabasePool();
    try {
      return c.json(
        await updateUser(pool, userId, userParams),
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
