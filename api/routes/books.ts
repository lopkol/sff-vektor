import z from "zod";
import { validator } from "hono/validator";
import { app } from "@/config/application.ts";
import {
  createBook,
  deleteBook,
  EntityNotFoundException,
  Genre,
  getBookById,
  getOrCreateDatabasePool,
  InvalidArgumentException,
  updateBook,
} from "@sffvektor/lib";

const createBookSchema = z.object({
  title: z.string(),
  year: z.number(),
  genre: z.nativeEnum(Genre),
  series: z.string().optional(),
  seriesNumber: z.string().optional(),
  isApproved: z.boolean(),
  isPending: z.boolean(),
  alternatives: z.array(z.object({
    name: z.string(),
    urls: z.array(z.string()),
  })).nonempty(),
});

const updateBookSchema = z.object({
  title: z.string().optional(),
  year: z.number().optional(),
  genre: z.nativeEnum(Genre).optional(),
  series: z.string().optional(),
  seriesNumber: z.string().optional(),
  isApproved: z.boolean().optional(),
  isPending: z.boolean().optional(),
  alternatives: z.array(z.object({
    name: z.string(),
    urls: z.array(z.string()),
  })).nonempty().optional(),
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
  validator("form", async (_, c) => {
    const parsed = createBookSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(parsed.error, 400);
    }
    return parsed.data;
  }),
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
  validator("form", async (_, c) => {
    const parsed = updateBookSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(parsed.error, 400);
    }
    return parsed.data;
  }),
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

app.delete("/api/books/:id", async (c) => {
  const pool = await getOrCreateDatabasePool();
  try {
    await deleteBook(pool, c.req.param("id"));
    return c.json({ message: "Book deleted" }, 200);
  } catch (error) {
    console.error(error);
    throw error;
  }
});
