import { app } from "@/config/application.ts";
import {
  bookFilterSchema,
  bookListRefSchema,
  createBook,
  createBookSchema,
  createOrUpdateBooksOfListFromMoly,
  deleteBook,
  EntityNotFoundException,
  getBookById,
  getBooks,
  getOrCreateDatabasePool,
  InvalidArgumentException,
  updateBook,
  updateBookSchema,
} from "@sffvektor/lib";
import { validateBody, validateQuery } from "@/middlewares/validator.ts";
import { isUserAdminMiddleware } from "@/middlewares/role-check.ts";
import { z } from "zod";
import { HttpStatusCode } from "@/helpers/http-code.ts";
import { mapExceptions } from "@/middlewares/map-exceptions.ts";

const createBookApiSchema = createBookSchema.strict();

const updateBookApiSchema = updateBookSchema.strict();

const bookFilterApiSchema = bookFilterSchema.extend({
  year: z.coerce.number(),
}).strict();

const bookListRefApiSchema = bookListRefSchema.extend({
  year: z.coerce.number(),
}).strict();

app.get("/api/books", validateQuery(bookFilterApiSchema), async (c) => {
  const pool = await getOrCreateDatabasePool();
  const query = c.req.valid("query");
  return c.json(await getBooks(pool, query));
});

app.get(
  "/api/books/:id",
  mapExceptions(
    [EntityNotFoundException, HttpStatusCode.NotFound],
  ),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    return c.json(await getBookById(pool, c.req.param("id")));
  },
);

app.post(
  "/api/books",
  isUserAdminMiddleware,
  validateBody(createBookApiSchema),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    return c.json(await createBook(pool, c.req.valid("form")), 201);
  },
);

app.patch(
  "/api/books/:id",
  isUserAdminMiddleware,
  validateBody(updateBookApiSchema),
  mapExceptions(
    [InvalidArgumentException, HttpStatusCode.BadRequest],
    [EntityNotFoundException, HttpStatusCode.NotFound],
  ),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    return c.json(
      await updateBook(
        pool,
        c.req.param("id"),
        c.req.valid("form"),
      ),
    );
  },
);

app.delete(
  "/api/books/:id",
  isUserAdminMiddleware,
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    await deleteBook(pool, c.req.param("id"));
    return c.json({ message: "Book deleted" });
  },
);

app.post(
  "/api/books/update-from-moly",
  isUserAdminMiddleware,
  validateBody(bookListRefApiSchema),
  mapExceptions(
    [EntityNotFoundException, HttpStatusCode.NotFound],
  ),
  async (c) => {
    const { year, genre } = c.req.valid("form");
    await createOrUpdateBooksOfListFromMoly(year, genre);
    return c.json({ message: "Books updated" });
  },
);
