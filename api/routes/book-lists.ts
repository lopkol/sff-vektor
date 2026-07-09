import { app } from "@/config/application.ts";
import { validateBody, validateParams } from "@/middlewares/validator.ts";
import {
  bookListRefSchema,
  createBookList,
  createBookListSchema,
  deleteBookList,
  EntityNotFoundException,
  getAllBookLists,
  getBookList,
  getBookListsForReader,
  getOrCreateDatabasePool,
  InvalidArgumentException,
  updateBookList,
  updateBookListSchema,
  UserRole,
} from "@sffvektor/lib";
import { isUserAdminMiddleware } from "@/middlewares/role-check.ts";
import { HttpStatusCode } from "@/helpers/http-code.ts";
import { mapExceptions } from "@/middlewares/map-exceptions.ts";
import { z } from "zod";

const createBookListApiSchema = createBookListSchema.strict();
const updateBookListApiSchema = updateBookListSchema.strict();
const bookListRefApiSchema = bookListRefSchema.extend({
  year: z.coerce.number(),
});

// Admins see every book list; other users see only the ones they're a reader of.
app.get("/api/book-lists", async (c) => {
  const user = c.get("user");
  const pool = await getOrCreateDatabasePool();
  const bookLists = user.role === UserRole.Admin
    ? await getAllBookLists(pool)
    : user.readerId
    ? await getBookListsForReader(pool, user.readerId)
    : [];
  return c.json(bookLists);
});

app.get(
  "/api/book-lists/:year/:genre",
  isUserAdminMiddleware,
  validateParams(bookListRefApiSchema),
  mapExceptions(
    [EntityNotFoundException, HttpStatusCode.NotFound],
  ),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    const { year, genre } = c.req.valid("param");
    const bookList = await getBookList(
      pool,
      year,
      genre,
    );
    return c.json(bookList);
  },
);

app.post(
  "/api/book-lists",
  isUserAdminMiddleware,
  validateBody(createBookListApiSchema),
  mapExceptions(
    [InvalidArgumentException, HttpStatusCode.BadRequest],
    [EntityNotFoundException, HttpStatusCode.NotFound],
  ),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    const bookList = await createBookList(pool, c.req.valid("form"));
    return c.json(bookList, 201);
  },
);

app.patch(
  "/api/book-lists/:year/:genre",
  isUserAdminMiddleware,
  validateParams(bookListRefApiSchema),
  validateBody(updateBookListApiSchema),
  mapExceptions(
    [InvalidArgumentException, HttpStatusCode.BadRequest],
    [EntityNotFoundException, HttpStatusCode.NotFound],
  ),
  async (c) => {
    const { year, genre } = c.req.valid("param");
    const pool = await getOrCreateDatabasePool();
    return c.json(
      await updateBookList(
        pool,
        year,
        genre,
        c.req.valid("form"),
      ),
    );
  },
);

app.delete(
  "/api/book-lists/:year/:genre",
  isUserAdminMiddleware,
  validateParams(bookListRefApiSchema),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    const { year, genre } = c.req.valid("param");
    await deleteBookList(pool, year, genre);
    return c.json({ message: "Book list deleted" });
  },
);
