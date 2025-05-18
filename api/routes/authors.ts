import { app } from "@/config/application.ts";
import {
  createAuthor,
  createAuthorSchema,
  deleteAuthor,
  EntityNotFoundException,
  getAuthorById,
  getOrCreateDatabasePool,
  InvalidArgumentException,
  updateAuthor,
  updateAuthorSchema,
} from "@sffvektor/lib";
import { validateBody } from "@/middlewares/validator.ts";
import { isUserAdminMiddleware } from "@/middlewares/role-check.ts";

const createAuthorApiSchema = createAuthorSchema.strict();

const updateAuthorApiSchema = updateAuthorSchema.strict();

app.get("/api/authors/:id", async (c) => {
  const pool = await getOrCreateDatabasePool();
  try {
    return c.json(await getAuthorById(pool, c.req.param("id")), 200);
  } catch (error) {
    if (error instanceof EntityNotFoundException) {
      return c.json({ message: error.message, details: error.details }, 404);
    }
    console.error(error);
    throw error;
  }
});

app.post(
  "/api/authors",
  isUserAdminMiddleware,
  validateBody(createAuthorApiSchema),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    try {
      const author = await createAuthor(pool, c.req.valid("form"));
      return c.json(author, 201);
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
);

app.patch(
  "/api/authors/:id",
  isUserAdminMiddleware,
  validateBody(updateAuthorApiSchema),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    try {
      return c.json(
        await updateAuthor(pool, c.req.param("id"), c.req.valid("form")),
        200,
      );
    } catch (error) {
      if (error instanceof InvalidArgumentException) {
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

app.delete("/api/authors/:id", isUserAdminMiddleware, async (c) => {
  const pool = await getOrCreateDatabasePool();
  try {
    await deleteAuthor(pool, c.req.param("id"));
    return c.json({ message: "Author deleted" }, 200);
  } catch (error) {
    console.error(error);
    throw error;
  }
});
