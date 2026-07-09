import { app } from "@/config/application.ts";
import {
  bookFilterSchema,
  bookListRefSchema,
  createBook,
  createBookSchema,
  createOrUpdateBooksFromMoly,
  deleteBook,
  EntityNotFoundException,
  ForbiddenException,
  Genre,
  getApprovedBooksWithReadingPlan,
  getBookById,
  getBooks,
  getOrCreateDatabasePool,
  InvalidArgumentException,
  isReaderOfBookList,
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

const bookWithReadingPlanFilterApiSchema = bookFilterApiSchema.extend({
  genre: z.enum(Genre),
}).strict();

const updateBooksFromMolyApiSchema = bookListRefSchema.extend({
  year: z.coerce.number(),
  genre: z.enum(Genre).optional(),
}).strict();

app.get(
  "/api/books",
  isUserAdminMiddleware,
  validateQuery(bookFilterApiSchema),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    const query = c.req.valid("query");
    return c.json(await getBooks(pool, query));
  },
);

// Returns the approved books of a book list annotated with the current reader's
// reading plan. Registered before "/api/books/:id" so the static path wins.
app.get(
  "/api/books/reading-plans",
  validateQuery(bookWithReadingPlanFilterApiSchema),
  async (c) => {
    const user = c.get("user");
    const { year, genre } = c.req.valid("query");
    const pool = await getOrCreateDatabasePool();

    if (
      !user.readerId ||
      !(await isReaderOfBookList(pool, year, genre, user.readerId))
    ) {
      throw new ForbiddenException(
        "You are not a jury member for this book list",
        "NOT_A_JURY_MEMBER",
      );
    }

    return c.json(
      await getApprovedBooksWithReadingPlan(pool, {
        year,
        genre,
        readerId: user.readerId,
      }),
    );
  },
);

app.get(
  "/api/books/:id",
  isUserAdminMiddleware,
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
  validateBody(updateBooksFromMolyApiSchema),
  mapExceptions(
    [EntityNotFoundException, HttpStatusCode.NotFound],
  ),
  async (c) => {
    const { year, genre } = c.req.valid("form");
    await createOrUpdateBooksFromMoly(year, genre);
    return c.json({ message: "Books updated" });
  },
);
