import { app } from "@/config/application.ts";
import { createFormValidator } from "@/middlewares/validator.ts";
import {
  createBookList,
  createBookListSchema,
  deleteBookList,
  EntityNotFoundException,
  enumFromString,
  Genre,
  getAllBookLists,
  getBookList,
  getOrCreateDatabasePool,
  InvalidArgumentException,
  UniqueConstraintException,
  updateBookList,
  updateBookListSchema,
} from "@sffvektor/lib";

const createBookListApiSchema = createBookListSchema.strict();

const updateBookListApiSchema = updateBookListSchema.strict();

app.get("/api/book-lists", async (c) => {
  const pool = await getOrCreateDatabasePool();
  const bookLists = await getAllBookLists(pool);
  return c.json(bookLists);
});

app.get("/api/book-lists/:year/:genre", async (c) => {
  const pool = await getOrCreateDatabasePool();
  const genreString = c.req.param("genre");
  const genre = enumFromString<Genre>(Genre, genreString);
  if (!genre) {
    return c.json({ message: "Invalid genre" }, 400);
  }
  try {
    const bookList = await getBookList(
      pool,
      parseInt(c.req.param("year")),
      genre,
    );
    return c.json(bookList);
  } catch (error) {
    if (error instanceof EntityNotFoundException) {
      return c.json({ message: error.message, details: error.details }, 404);
    }
    throw error;
  }
});

app.post(
  "/api/book-lists",
  createFormValidator(createBookListApiSchema),
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
        return c.json({ message: error.message, details: error.details }, 400);
      }
      if (error instanceof EntityNotFoundException) {
        return c.json({ message: error.message, details: error.details }, 404);
      }
      throw error;
    }
  },
);

app.patch(
  "/api/book-lists/:year/:genre",
  createFormValidator(updateBookListApiSchema),
  async (c) => {
    const genreString = c.req.param("genre");
    const genre = enumFromString<Genre>(Genre, genreString);
    if (!genre) {
      return c.json({ message: "Invalid genre" }, 400);
    }

    const pool = await getOrCreateDatabasePool();
    try {
      const bookList = await updateBookList(
        pool,
        parseInt(c.req.param("year")),
        genre,
        c.req.valid("form"),
      );
      return c.json(bookList);
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        return c.json({ message: error.message, details: error.details }, 404);
      }
      if (error instanceof InvalidArgumentException) {
        return c.json({ message: error.message, details: error.details }, 400);
      }
      throw error;
    }
  },
);

app.delete(
  "/api/book-lists/:year/:genre",
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    const genreString = c.req.param("genre");
    const genre = enumFromString<Genre>(Genre, genreString);
    if (!genre) {
      return c.json({ message: "Invalid genre" }, 400);
    }
    await deleteBookList(pool, parseInt(c.req.param("year")), genre);
    return c.json({ message: "Book list deleted" });
  },
);
