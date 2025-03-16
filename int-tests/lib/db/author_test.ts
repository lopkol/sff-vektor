import { assertEquals, assertRejects } from "@std/assert";
import { afterAll, afterEach, beforeAll, describe, it } from "@std/testing/bdd";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";
import { clearDatabase } from "@/setup/clear_database.ts";
import {
  createAuthor,
  deleteAuthor,
  EntityNotFoundException,
  getAuthorById,
  getOrCreateDatabasePool,
  InvalidArgumentException,
  updateAuthor,
} from "@sffvektor/lib";

describe("author db functions", () => {
  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("createAuthor", () => {
    it("creates an author", async () => {
      const pool = await getOrCreateDatabasePool();

      const author = await createAuthor(pool, {
        displayName: "John Doe",
        sortName: "Doe, John",
        isApproved: true,
      });

      const authorInDb = await getAuthorById(pool, author.id);
      assertEquals(authorInDb.id, author.id);
      assertEquals(authorInDb.displayName, author.displayName);
      assertEquals(authorInDb.sortName, author.sortName);
      assertEquals(authorInDb.isApproved, author.isApproved);
    });
  });

  describe("getAuthorById", () => {
    it("returns an author", async () => {
      const pool = await getOrCreateDatabasePool();
      const author = await createAuthor(pool, {
        displayName: "John Doe",
        sortName: "Doe, John",
        isApproved: true,
      });

      const fetchedAuthor = await getAuthorById(pool, author.id);

      assertEquals(fetchedAuthor.id, author.id);
      assertEquals(fetchedAuthor.displayName, author.displayName);
      assertEquals(fetchedAuthor.sortName, author.sortName);
      assertEquals(fetchedAuthor.isApproved, author.isApproved);
    });

    it("throws an error if the author does not exist", async () => {
      const pool = await getOrCreateDatabasePool();

      await assertRejects(
        async () =>
          await getAuthorById(pool, "01959a55-2918-79b0-acb1-381fda3f3b90"),
        EntityNotFoundException,
      );
    });
  });

  describe("updateAuthor", () => {
    it("updates an author", async () => {
      const pool = await getOrCreateDatabasePool();
      const author = await createAuthor(pool, {
        displayName: "John Doe",
        sortName: "Doe, John",
        isApproved: true,
      });

      await updateAuthor(pool, author.id, {
        displayName: "Jane Doe",
        sortName: "Doe, Jane",
        isApproved: false,
      });

      const authorInDb = await getAuthorById(pool, author.id);
      assertEquals(authorInDb.id, author.id);
      assertEquals(authorInDb.displayName, "Jane Doe");
      assertEquals(authorInDb.sortName, "Doe, Jane");
      assertEquals(authorInDb.isApproved, false);
    });

    it("throws an error if the author does not exist", async () => {
      const pool = await getOrCreateDatabasePool();

      await assertRejects(
        async () =>
          await updateAuthor(pool, "01959a55-2918-79b0-acb1-381fda3f3b90", {
            displayName: "Jane Doe",
          }),
        EntityNotFoundException,
      );
    });

    it("throws an error if no properties are provided", async () => {
      const pool = await getOrCreateDatabasePool();
      const author = await createAuthor(pool, {
        displayName: "John Doe",
        sortName: "Doe, John",
        isApproved: true,
      });

      await assertRejects(
        async () => await updateAuthor(pool, author.id, {}),
        InvalidArgumentException,
      );
    });
  });

  describe("deleteAuthor", () => {
    it("deletes an author", async () => {
      const pool = await getOrCreateDatabasePool();
      const author = await createAuthor(pool, {
        displayName: "John Doe",
        sortName: "Doe, John",
        isApproved: true,
      });

      await deleteAuthor(pool, author.id);

      await assertRejects(
        async () => await getAuthorById(pool, author.id),
        EntityNotFoundException,
      );
    });
  });
});
