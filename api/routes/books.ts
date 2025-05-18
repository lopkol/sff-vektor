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
import { validateBody } from "@/middlewares/validator.ts";
import { isUserAdminMiddleware } from "@/middlewares/role-check.ts";
import { z } from "zod";

const createBookApiSchema = createBookSchema.strict();

const updateBookApiSchema = updateBookSchema.strict();

const bookFilterApiSchema = bookFilterSchema.extend({
  year: z.coerce.number(),
}).strict();

app.get("/api/books", async (c) => {
  const pool = await getOrCreateDatabasePool();
  const parsed = bookFilterApiSchema.safeParse(c.req.query);
  if (!parsed.success) {
    return c.json(parsed.error, 400);
  }
  const books = await getBooks(pool, parsed.data);
  return c.json(books);
});

app.get("/api/books/:id", async (c) => {
  const pool = await getOrCreateDatabasePool();
  try {
    const book = await getBookById(pool, c.req.param("id"));
    return c.json(book);
  } catch (error) {
    if (error instanceof EntityNotFoundException) {
      return c.json({ message: error.message, details: error.details }, 404);
    }
    console.error(error);
    throw error;
  }
});

app.post(
  "/api/books",
  isUserAdminMiddleware,
  validateBody(createBookApiSchema),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    try {
      return c.json(
        await createBook(pool, c.req.valid("form")),
        201,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
);

app.patch(
  "/api/books/:id",
  isUserAdminMiddleware,
  validateBody(updateBookApiSchema),
  async (c) => {
    const pool = await getOrCreateDatabasePool();
    try {
      return c.json(
        await updateBook(pool, c.req.param("id"), c.req.valid("form")),
        201,
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

app.delete("/api/books/:id", isUserAdminMiddleware, async (c) => {
  const pool = await getOrCreateDatabasePool();
  try {
    await deleteBook(pool, c.req.param("id"));
    return c.json({ message: "Book deleted" }, 200);
  } catch (error) {
    console.error(error);
    throw error;
  }
});

app.post(
  "/api/books/update-from-moly",
  isUserAdminMiddleware,
  validateBody(bookListRefSchema),
  async (c) => {
    try {
      const { year, genre } = c.req.valid("form");
      await createOrUpdateBooksOfListFromMoly(year, genre);
      return c.json({ message: "Books updated" }, 200);
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        return c.json({ message: error.message, details: error.details }, 404);
      }
      console.error(error);
      throw error;
    }
  },
);
