import { app } from "@/config/application.ts";
import {
  createAuthor,
  createAuthorSchema,
  deleteAuthor,
  EntityNotFoundException,
  getAuthorById,
  getAuthors,
  getOrCreateDatabasePool,
  InvalidArgumentException,
  updateAuthor,
  updateAuthorSchema,
} from "@sffvektor/lib";
import { validateBody } from "@/middlewares/validator.ts";
import { isUserAdminMiddleware } from "@/middlewares/role-check.ts";
import { HttpStatusCode } from "@/helpers/http-code.ts";
import { mapExceptions } from "@/middlewares/map-exceptions.ts";

const createAuthorApiSchema = createAuthorSchema.strict();

const updateAuthorApiSchema = updateAuthorSchema.strict();

app.get(
  "/api/authors",
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    return c.json(await getAuthors(pool));
  },
);

app.get(
  "/api/authors/:id",
  mapExceptions(
    [EntityNotFoundException, HttpStatusCode.NotFound],
  ),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    return c.json(await getAuthorById(pool, c.req.param("id")));
  },
);

app.post(
  "/api/authors",
  isUserAdminMiddleware,
  validateBody(createAuthorApiSchema),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    return c.json(await createAuthor(pool, c.req.valid("form")), 201);
  },
);

app.patch(
  "/api/authors/:id",
  isUserAdminMiddleware,
  validateBody(updateAuthorApiSchema),
  mapExceptions(
    [InvalidArgumentException, HttpStatusCode.BadRequest],
    [EntityNotFoundException, HttpStatusCode.NotFound],
  ),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    return c.json(
      await updateAuthor(
        pool,
        c.req.param("id"),
        c.req.valid("form"),
      ),
    );
  },
);

app.delete(
  "/api/authors/:id",
  isUserAdminMiddleware,
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    await deleteAuthor(pool, c.req.param("id"));
    return c.json({ message: "Author deleted" }, 200);
  },
);
