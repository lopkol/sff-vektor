import z from "zod";
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
import { createFormValidator } from "@/middlewares/validator.ts";

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
    console.error(error);
    throw error;
  }
});

app.post(
  "/api/authors",
  createFormValidator(createAuthorSchema),
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
  createFormValidator(updateAuthorSchema),
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

app.delete("/api/authors/:id", async (c) => {
  const pool = await getOrCreateDatabasePool();
  try {
    await deleteAuthor(pool, c.req.param("id"));
    return c.json({ message: "Author deleted" }, 200);
  } catch (error) {
    console.error(error);
    throw error;
  }
});
