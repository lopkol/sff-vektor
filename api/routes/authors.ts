import z from "zod";
import { validator } from "hono/validator";
import { app } from "@/config/application.ts";
import {
  createAuthor,
  deleteAuthor,
  EntityNotFoundException,
  getAuthorById,
  getOrCreateDatabasePool,
  InvalidArgumentException,
  updateAuthor,
} from "@sffvektor/lib";

const createAuthorSchema = z.object({
  displayName: z.string(),
  sortName: z.string(),
  isApproved: z.boolean(),
});

const updateAuthorSchema = z.object({
  displayName: z.string().optional(),
  sortName: z.string().optional(),
  isApproved: z.boolean().optional(),
});

app.get("/api/authors/:id", async (c) => {
  const pool = await getOrCreateDatabasePool();
  try {
    return c.json(await getAuthorById(pool, c.req.param("id")), 200);
  } catch (error) {
    if (error instanceof EntityNotFoundException) {
      return c.json({ message: error.message, details: error.details }, 404);
    }
    throw error;
  }
});

app.post(
  "/api/authors",
  validator("form", async (_, c) => {
    const parsed = createAuthorSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(parsed.error, 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { displayName, sortName, isApproved } = c.req.valid("form");
    const pool = await getOrCreateDatabasePool();
    const author = await createAuthor(pool, {
      displayName,
      sortName,
      isApproved,
    });
    return c.json(author, 201);
  },
);

app.patch(
  "/api/authors/:id",
  validator("form", async (_, c) => {
    const parsed = updateAuthorSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(parsed.error, 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { displayName, sortName, isApproved } = c.req.valid("form");
    const pool = await getOrCreateDatabasePool();
    try {
      return c.json(
        await updateAuthor(pool, c.req.param("id"), {
          displayName,
          sortName,
          isApproved,
        }),
        200,
      );
    } catch (error) {
      if (error instanceof InvalidArgumentException) {
        return c.json({ message: error.message, details: error.details }, 400);
      }
      if (error instanceof EntityNotFoundException) {
        return c.json({ message: error.message, details: error.details }, 404);
      }
      throw error;
    }
  },
);

app.delete("/api/authors/:id", async (c) => {
  const pool = await getOrCreateDatabasePool();
  await deleteAuthor(pool, c.req.param("id"));
  return c.json({ message: "Author deleted" }, 200);
});
