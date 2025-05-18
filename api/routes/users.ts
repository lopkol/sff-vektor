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
import { HttpStatusCode } from "@/helpers/http-code.ts";
import { mapExceptions } from "@/middlewares/map-exceptions.ts";

const createUserApiSchema = createUserSchema.strict();

const updateUserApiSchema = updateUserSchema.strict();

app.get("/api/users", isUserAdminMiddleware, async (c) => {
  const pool = await getOrCreateDatabasePool();
  return c.json(await getAllUsers(pool), 200);
});

app.get(
  "/api/users/:id",
  isUserAdminMiddleware,
  mapExceptions(
    [EntityNotFoundException, HttpStatusCode.NotFound],
  ),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    return c.json(await getUserById(pool, c.req.param("id")), 200);
  },
);

app.post(
  "/api/users",
  isUserAdminMiddleware,
  validateBody(createUserApiSchema),
  mapExceptions(
    [UniqueConstraintException, HttpStatusCode.BadRequest],
  ),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    return c.json(await createUser(pool, c.req.valid("form")), 201);
  },
);

app.patch(
  "/api/users/:id",
  isUserAdminMiddleware,
  validateBody(updateUserApiSchema),
  mapExceptions(
    [InvalidArgumentException, HttpStatusCode.BadRequest],
    [EntityNotFoundException, HttpStatusCode.NotFound],
  ),
  async (c) => {
    const userId = c.req.param("id");
    const userParams = c.req.valid("form");

    // Users cannot deactivate themselves
    const currentUser = c.get("user");
    if (currentUser.id === userId && userParams.isActive === false) {
      return c.json({ message: "Cannot deactivate yourself" }, 400);
    }

    const pool = await getOrCreateDatabasePool();
    return c.json(await updateUser(pool, userId, userParams));
  },
);
