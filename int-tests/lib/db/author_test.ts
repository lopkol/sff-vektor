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
  getAuthorByName,
  getAuthors,
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
        url: "https://example.com",
        isApproved: true,
      });

      const authorInDb = await getAuthorById(pool, author.id);
      assertEquals(authorInDb.id, author.id);
      assertEquals(authorInDb.displayName, author.displayName);
      assertEquals(authorInDb.sortName, author.sortName);
      assertEquals(authorInDb.url, author.url);
      assertEquals(authorInDb.isApproved, author.isApproved);
    });
  });

  describe("getAuthors", () => {
    it("returns empty array if no authors exist", async () => {
      const pool = await getOrCreateDatabasePool();
      const authors = await getAuthors(pool);
      assertEquals(authors.length, 0);
    });

    it("returns all authors sorted by sortName", async () => {
      const pool = await getOrCreateDatabasePool();
      const author1 = await createAuthor(pool, {
        displayName: "John Doe",
        sortName: "Doe, John",
        url: "https://example.com",
        isApproved: true,
      });
      const author2 = await createAuthor(pool, {
        displayName: "Jane Doe",
        sortName: "Doe, Jane",
        url: "https://example.com/jane",
        isApproved: true,
      });
      const author3 = await createAuthor(pool, {
        displayName: "John Smith",
        sortName: "Smith, John",
        url: "https://example.com/john",
        isApproved: true,
      });
      const author4 = await createAuthor(pool, {
        displayName: "Jane Doeg",
        sortName: "Doeg, Jane",
        url: "https://example.com/jane",
        isApproved: true,
      });

      const authors = await getAuthors(pool);

      assertEquals(authors.length, 4);
      assertEquals(authors[0].id, author2.id);
      assertEquals(authors[1].id, author1.id);
      assertEquals(authors[2].id, author4.id);
      assertEquals(authors[3].id, author3.id);
    });
  });

  describe("getAuthorById", () => {
    it("returns an author", async () => {
      const pool = await getOrCreateDatabasePool();
      const author = await createAuthor(pool, {
        displayName: "John Doe",
        sortName: "Doe, John",
        url: "https://example.com",
        isApproved: true,
      });

      const fetchedAuthor = await getAuthorById(pool, author.id);

      assertEquals(fetchedAuthor.id, author.id);
      assertEquals(fetchedAuthor.displayName, author.displayName);
      assertEquals(fetchedAuthor.sortName, author.sortName);
      assertEquals(fetchedAuthor.url, author.url);
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

  describe("getAuthorByName", () => {
    it("returns an author", async () => {
      const pool = await getOrCreateDatabasePool();
      const author = await createAuthor(pool, {
        displayName: "John Doe",
        sortName: "Doe, John",
        isApproved: true,
      });

      const fetchedAuthor = await getAuthorByName(pool, "John Doe");

      assertEquals(fetchedAuthor?.id, author.id);
      assertEquals(fetchedAuthor?.displayName, "John Doe");
      assertEquals(fetchedAuthor?.sortName, "Doe, John");
      assertEquals(fetchedAuthor?.isApproved, true);
    });

    it("returns null if the author does not exist", async () => {
      const pool = await getOrCreateDatabasePool();

      const author = await getAuthorByName(pool, "John Doe");

      assertEquals(author, null);
    });
  });

  describe("updateAuthor", () => {
    it("updates an author", async () => {
      const pool = await getOrCreateDatabasePool();
      const author = await createAuthor(pool, {
        displayName: "John Doe",
        sortName: "Doe, John",
        url: "https://example.com",
        isApproved: true,
      });

      await updateAuthor(pool, author.id, {
        displayName: "Jane Doe",
        sortName: "Doe, Jane",
        url: "https://example.com/jane",
        isApproved: false,
      });

      const authorInDb = await getAuthorById(pool, author.id);
      assertEquals(authorInDb.id, author.id);
      assertEquals(authorInDb.displayName, "Jane Doe");
      assertEquals(authorInDb.sortName, "Doe, Jane");
      assertEquals(authorInDb.url, "https://example.com/jane");
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
