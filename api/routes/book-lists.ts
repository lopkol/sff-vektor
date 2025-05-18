import { app } from "@/config/application.ts";
import { validateBody } from "@/middlewares/validator.ts";
import {
  bookListRefSchema,
  createBookList,
  createBookListSchema,
  deleteBookList,
  EntityNotFoundException,
  getAllBookLists,
  getBookList,
  getOrCreateDatabasePool,
  InvalidArgumentException,
  UniqueConstraintException,
  updateBookList,
  updateBookListSchema,
} from "@sffvektor/lib";
import { isUserAdminMiddleware } from "@/middlewares/role-check.ts";

const createBookListApiSchema = createBookListSchema.strict();

const updateBookListApiSchema = updateBookListSchema.strict();

app.get("/api/book-lists", async (c) => {
  const pool = await getOrCreateDatabasePool();
  const bookLists = await getAllBookLists(pool);
  return c.json(bookLists);
});

app.get("/api/book-lists/:year/:genre", async (c) => {
  const pool = await getOrCreateDatabasePool();
  const parsed = bookListRefSchema.safeParse({
    year: parseInt(c.req.param("year")),
    genre: c.req.param("genre"),
  });
  if (!parsed.success) {
    return c.json(parsed.error, 400);
  }
  try {
    const bookList = await getBookList(
      pool,
      parsed.data.year,
      parsed.data.genre,
    );
    return c.json(bookList);
  } catch (error) {
    if (error instanceof EntityNotFoundException) {
      return c.json({
        message: error.message,
        code: error.code,
        details: error.details,
      }, 404);
    }
    throw error;
  }
});

app.post(
  "/api/book-lists",
  isUserAdminMiddleware,
  validateBody(createBookListApiSchema),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    try {
      const bookList = await createBookList(pool, c.req.valid("form"));
      return c.json(bookList);
    } catch (error) {
      if (
        error instanceof UniqueConstraintException ||
        error instanceof InvalidArgumentException
      ) {
        return c.json({
          message: error.message,
          code: error.code,
          details: error.details,
        }, 400);
      }
      if (error instanceof EntityNotFoundException) {
        return c.json({
          message: error.message,
          code: error.code,
          details: error.details,
        }, 404);
      }
      throw error;
    }
  },
);

app.patch(
  "/api/book-lists/:year/:genre",
  isUserAdminMiddleware,
  validateBody(updateBookListApiSchema),
  async (c) => {
    const parsed = bookListRefSchema.safeParse({
      year: parseInt(c.req.param("year")),
      genre: c.req.param("genre"),
    });
    if (!parsed.success) {
      return c.json(parsed.error, 400);
    }

    const pool = await getOrCreateDatabasePool();
    try {
      const bookList = await updateBookList(
        pool,
        parsed.data.year,
        parsed.data.genre,
        c.req.valid("form"),
      );
      return c.json(bookList);
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        return c.json({
          message: error.message,
          code: error.code,
          details: error.details,
        }, 404);
      }
      if (error instanceof InvalidArgumentException) {
        return c.json({
          message: error.message,
          code: error.code,
          details: error.details,
        }, 400);
      }
      throw error;
    }
  },
);

app.delete(
  "/api/book-lists/:year/:genre",
  isUserAdminMiddleware,
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    const parsed = bookListRefSchema.safeParse({
      year: parseInt(c.req.param("year")),
      genre: c.req.param("genre"),
    });
    if (!parsed.success) {
      return c.json(parsed.error, 400);
    }
    await deleteBookList(pool, parsed.data.year, parsed.data.genre);
    return c.json({ message: "Book list deleted" });
  },
);
