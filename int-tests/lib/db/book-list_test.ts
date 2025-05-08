import {
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertRejects,
} from "@std/assert";
import { afterAll, afterEach, beforeAll, describe, it } from "@std/testing/bdd";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";
import { clearDatabase } from "@/setup/clear_database.ts";
import {
  createBookList,
  createReader,
  deleteBookList,
  EntityNotFoundException,
  Genre,
  getAllBookLists,
  getBookList,
  getOrCreateDatabasePool,
  InvalidArgumentException,
  UniqueConstraintException,
  updateBookList,
} from "@sffvektor/lib";

describe("book list db functions", () => {
  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("createBookList", () => {
    it("creates a book list without readers", async () => {
      const pool = await getOrCreateDatabasePool();

      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/book-list",
        pendingUrl: "https://example.com/book-list-pending",
        readers: [],
      });

      const bookListInDb = await getBookList(pool, 2024, Genre.Fantasy);
      assertEquals(bookListInDb.year, 2024);
      assertEquals(bookListInDb.genre, Genre.Fantasy);
      assertEquals(bookListInDb.url, "https://example.com/book-list");
      assertEquals(
        bookListInDb.pendingUrl,
        "https://example.com/book-list-pending",
      );
      assertEquals(bookListInDb.readers.length, 0);
    });

    it("creates a book list with readers", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader1 = await createReader(pool, {
        molyUsername: "test",
        molyUrl: "https://example.com",
      });
      const reader2 = await createReader(pool, {
        molyUsername: "test2",
        molyUrl: "https://example.com/test2",
      });

      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/book-list",
        pendingUrl: "https://example.com/book-list-pending",
        readers: [reader1.id, reader2.id],
      });

      const bookListInDb = await getBookList(pool, 2024, Genre.Fantasy);
      assertEquals(bookListInDb.readers.length, 2);
      assertEquals(bookListInDb.readers[0], reader1.id);
      assertEquals(bookListInDb.readers[1], reader2.id);
    });

    it("throws an error if the book list already exists", async () => {
      const pool = await getOrCreateDatabasePool();
      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/book-list",
        pendingUrl: "https://example.com/book-list-pending",
        readers: [],
      });

      await assertRejects(
        () =>
          createBookList(pool, {
            year: 2024,
            genre: Genre.Fantasy,
            url: "https://example.com/book-list/test",
            pendingUrl: "https://example.com/book-list-pending/test",
            readers: [],
          }),
        UniqueConstraintException,
      );
    });

    it("throws an error if a reader id is not valid", async () => {
      const pool = await getOrCreateDatabasePool();

      await assertRejects(
        () =>
          createBookList(pool, {
            year: 2024,
            genre: Genre.Fantasy,
            url: "https://example.com/book-list",
            pendingUrl: "https://example.com/book-list-pending",
            readers: ["non-existent-reader-id"],
          }),
        InvalidArgumentException,
      );
    });

    it("throws an error if a reader does not exist", async () => {
      const pool = await getOrCreateDatabasePool();
      await assertRejects(
        () =>
          createBookList(pool, {
            year: 2024,
            genre: Genre.Fantasy,
            url: "https://example.com/book-list",
            pendingUrl: "https://example.com/book-list-pending",
            readers: ["0195bda3-0273-700d-8a4c-a2548e5a5888"],
          }),
        EntityNotFoundException,
      );
    });
  });

  describe("getBookList", () => {
    it("gets a book list", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader1 = await createReader(pool, {
        molyUsername: "test",
        molyUrl: "https://example.com",
      });
      const reader2 = await createReader(pool, {
        molyUsername: "test2",
        molyUrl: "https://example.com/test2",
      });
      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/book-list",
        pendingUrl: "https://example.com/book-list-pending",
        readers: [reader1.id, reader2.id],
      });

      const result = await getBookList(pool, 2024, Genre.Fantasy);

      assertExists(result);
      assertEquals(result.year, 2024);
      assertEquals(result.genre, Genre.Fantasy);
      assertEquals(result.url, "https://example.com/book-list");
      assertEquals(result.pendingUrl, "https://example.com/book-list-pending");
      assertEquals(result.readers.length, 2);
      assertEquals(result.readers[0], reader1.id);
      assertEquals(result.readers[1], reader2.id);
    });

    it("throws an error if the book list does not exist", async () => {
      const pool = await getOrCreateDatabasePool();
      await assertRejects(
        () => getBookList(pool, 2024, Genre.Fantasy),
        EntityNotFoundException,
      );
    });
  });

  describe("getAllBookLists", () => {
    it("gets all book lists in descending order", async () => {
      const pool = await getOrCreateDatabasePool();
      await createBookList(pool, {
        year: 2022,
        genre: Genre.Fantasy,
        url: "https://example.com/book-list1",
        pendingUrl: "https://example.com/book-list-pending1",
        readers: [],
      });
      await createBookList(pool, {
        year: 2023,
        genre: Genre.Fantasy,
        url: "https://example.com/book-list2",
        pendingUrl: "https://example.com/book-list-pending2",
        readers: [],
      });
      await createBookList(pool, {
        year: 2023,
        genre: Genre.SciFi,
        url: "https://example.com/book-list3",
        pendingUrl: "https://example.com/book-list-pending3",
        readers: [],
      });
      await createBookList(pool, {
        year: 2024,
        genre: Genre.SciFi,
        url: "https://example.com/book-list4",
        pendingUrl: "https://example.com/book-list-pending4",
        readers: [],
      });

      const result = await getAllBookLists(pool);
      assertEquals(result.length, 4);
      assertEquals(result[0], {
        year: 2024,
        genre: Genre.SciFi,
        url: "https://example.com/book-list4",
        pendingUrl: "https://example.com/book-list-pending4",
      });
      assertEquals(result[1], {
        year: 2023,
        genre: Genre.SciFi,
        url: "https://example.com/book-list3",
        pendingUrl: "https://example.com/book-list-pending3",
      });
      assertEquals(result[2], {
        year: 2023,
        genre: Genre.Fantasy,
        url: "https://example.com/book-list2",
        pendingUrl: "https://example.com/book-list-pending2",
      });
      assertEquals(result[3], {
        year: 2022,
        genre: Genre.Fantasy,
        url: "https://example.com/book-list1",
        pendingUrl: "https://example.com/book-list-pending1",
      });
    });
  });

  describe("updateBookList", () => {
    it("throws an error if there are no props to update", async () => {
      const pool = await getOrCreateDatabasePool();
      await assertRejects(
        () => updateBookList(pool, 2024, Genre.Fantasy, {}),
        InvalidArgumentException,
      );
    });

    it("throws an error if the book list does not exist", async () => {
      const pool = await getOrCreateDatabasePool();
      await assertRejects(
        () =>
          updateBookList(pool, 2024, Genre.Fantasy, {
            url: "https://example.com/book-list-updated",
          }),
        EntityNotFoundException,
      );
    });

    it("updates a book list", async () => {
      const pool = await getOrCreateDatabasePool();
      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/book-list",
        pendingUrl: "https://example.com/book-list-pending",
        readers: [],
      });

      await updateBookList(pool, 2024, Genre.Fantasy, {
        url: "https://example.com/book-list-updated",
        pendingUrl: "https://example.com/book-list-pending-updated",
      });

      const bookListInDb = await getBookList(pool, 2024, Genre.Fantasy);
      assertEquals(bookListInDb.url, "https://example.com/book-list-updated");
      assertEquals(
        bookListInDb.pendingUrl,
        "https://example.com/book-list-pending-updated",
      );
    });

    it("updates a book list with readers", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader1 = await createReader(pool, {
        molyUsername: "test",
        molyUrl: "https://example.com",
      });
      const reader2 = await createReader(pool, {
        molyUsername: "test2",
        molyUrl: "https://example.com/test2",
      });
      const reader3 = await createReader(pool, {
        molyUsername: "test3",
        molyUrl: "https://example.com/test3",
      });
      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/book-list",
        pendingUrl: "https://example.com/book-list-pending",
        readers: [reader1.id, reader2.id],
      });

      await updateBookList(pool, 2024, Genre.Fantasy, {
        readers: [reader2.id, reader3.id],
      });

      const bookListInDb = await getBookList(pool, 2024, Genre.Fantasy);
      assertEquals(bookListInDb.readers.length, 2);
      assertArrayIncludes(bookListInDb.readers, [reader2.id, reader3.id]);
    });

    it("removes the readers from the book list", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader1 = await createReader(pool, {
        molyUsername: "test",
        molyUrl: "https://example.com",
      });
      const reader2 = await createReader(pool, {
        molyUsername: "test2",
        molyUrl: "https://example.com/test2",
      });
      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/book-list",
        pendingUrl: "https://example.com/book-list-pending",
        readers: [reader1.id, reader2.id],
      });

      await updateBookList(pool, 2024, Genre.Fantasy, {
        readers: [],
      });

      const bookListInDb = await getBookList(pool, 2024, Genre.Fantasy);
      assertEquals(bookListInDb.readers.length, 0);
    });

    it("throws an error if a reader id is not valid", async () => {
      const pool = await getOrCreateDatabasePool();
      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/book-list",
        pendingUrl: "https://example.com/book-list-pending",
        readers: [],
      });

      await assertRejects(
        () =>
          updateBookList(pool, 2024, Genre.Fantasy, {
            readers: ["non-existent-reader-id"],
          }),
        InvalidArgumentException,
      );
    });

    it("throws an error if a reader does not exist", async () => {
      const pool = await getOrCreateDatabasePool();
      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/book-list",
        pendingUrl: "https://example.com/book-list-pending",
        readers: [],
      });

      await assertRejects(
        () =>
          updateBookList(pool, 2024, Genre.Fantasy, {
            readers: ["0195bda3-0273-700d-8a4c-a2548e5a5888"],
          }),
        EntityNotFoundException,
      );
    });
  });

  describe("deleteBookList", () => {
    it("deletes a book list", async () => {
      const pool = await getOrCreateDatabasePool();
      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/book-list",
        pendingUrl: "https://example.com/book-list-pending",
        readers: [],
      });

      await deleteBookList(pool, 2024, Genre.Fantasy);

      await assertRejects(
        () => getBookList(pool, 2024, Genre.Fantasy),
        EntityNotFoundException,
      );
    });
  });
});
