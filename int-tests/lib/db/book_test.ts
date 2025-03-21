import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { afterAll, afterEach, beforeAll, describe, it } from "@std/testing/bdd";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";
import { clearDatabase } from "@/setup/clear_database.ts";
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

describe("book db functions", () => {
  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("createBook", () => {
    it("creates a book (without alternatives)", async () => {
      const pool = await getOrCreateDatabasePool();

      const book = await createBook(pool, {
        title: "The Hobbit",
        year: 1937,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
      });

      const bookInDb = await getBookById(pool, book.id);
      assertEquals(bookInDb.title, "The Hobbit");
      assertEquals(bookInDb.year, 1937);
      assertEquals(bookInDb.genre, Genre.Fantasy);
      assertEquals(bookInDb.series, "The Hobbit");
      assertEquals(bookInDb.seriesNumber, "1");
      assertEquals(bookInDb.isApproved, true);
      assertEquals(bookInDb.isPending, false);
      assertEquals(bookInDb.alternatives, []);
      assertExists(bookInDb.id);
      assertExists(bookInDb.createdAt);
      assertExists(bookInDb.updatedAt);
    });

    it("creates book alternatives", async () => {
      const pool = await getOrCreateDatabasePool();

      const book = await createBook(pool, {
        title: "The Hobbit",
        year: 1937,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [
          {
            name: "original",
            urls: ["https://example.com", "https://example.com/original2"],
          },
          {
            name: "audiobook",
            urls: ["https://example.com/audiobook"],
          },
        ],
      });

      const bookInDb = await getBookById(pool, book.id);
      assertEquals(bookInDb.alternatives.length, 2);
      const original = bookInDb.alternatives.find((alternative) =>
        alternative.name === "original"
      );
      assertExists(original);
      assertEquals(original.urls, [
        "https://example.com",
        "https://example.com/original2",
      ]);
      const audiobook = bookInDb.alternatives.find((alternative) =>
        alternative.name === "audiobook"
      );
      assertExists(audiobook);
      assertEquals(audiobook.urls, ["https://example.com/audiobook"]);
    });
  });

  describe("getBookById", () => {
    it("returns a book", async () => {
      const pool = await getOrCreateDatabasePool();
      const book = await createBook(pool, {
        title: "The Hobbit",
        year: 1937,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [
          {
            name: "original",
            urls: ["https://example.com", "https://example.com/original2"],
          },
        ],
      });

      const fetchedBook = await getBookById(pool, book.id);

      assertEquals(fetchedBook.title, "The Hobbit");
      assertEquals(fetchedBook.year, 1937);
      assertEquals(fetchedBook.genre, Genre.Fantasy);
      assertEquals(fetchedBook.series, "The Hobbit");
      assertEquals(fetchedBook.seriesNumber, "1");
      assertEquals(fetchedBook.isApproved, true);
      assertEquals(fetchedBook.isPending, false);
      assertEquals(fetchedBook.alternatives.length, 1);
      assertEquals(fetchedBook.alternatives[0].name, "original");
      assertEquals(fetchedBook.alternatives[0].urls, [
        "https://example.com",
        "https://example.com/original2",
      ]);
    });

    it("throws an error if the book does not exist", async () => {
      const pool = await getOrCreateDatabasePool();
      await assertRejects(
        async () =>
          await getBookById(pool, "01959eb7-34e3-7868-8c24-c6fa64188453"),
        EntityNotFoundException,
      );
    });
  });

  describe("updateBook", () => {
    it("updates a book (without alternatives)", async () => {
      const pool = await getOrCreateDatabasePool();
      const book = await createBook(pool, {
        title: "The Hobbit",
        year: 1937,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
      });

      await updateBook(pool, book.id, {
        title: "The Lord of the Rings: The Two Towers",
        year: 1954,
        series: "The Lord of the Rings",
        seriesNumber: "2",
      });

      const bookInDb = await getBookById(pool, book.id);
      assertEquals(bookInDb.title, "The Lord of the Rings: The Two Towers");
      assertEquals(bookInDb.year, 1954);
      assertEquals(bookInDb.series, "The Lord of the Rings");
      assertEquals(bookInDb.seriesNumber, "2");
      assertEquals(bookInDb.genre, Genre.Fantasy);
      assertEquals(bookInDb.isApproved, true);
      assertEquals(bookInDb.isPending, false);
    });

    it("updates book alternatives", async () => {
      const pool = await getOrCreateDatabasePool();
      const book = await createBook(pool, {
        title: "The Hobbit",
        year: 1937,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [
          {
            name: "original",
            urls: ["https://example.com"],
          },
        ],
      });

      await updateBook(pool, book.id, {
        alternatives: [
          {
            name: "original",
            urls: ["https://example.com/original"],
          },
          {
            name: "audiobook",
            urls: [
              "https://example.com/audiobook",
              "https://example.com/audiobook2",
            ],
          },
        ],
      });

      const bookInDb = await getBookById(pool, book.id);
      assertEquals(bookInDb.alternatives.length, 2);
      const original = bookInDb.alternatives.find((alternative) =>
        alternative.name === "original"
      );
      assertExists(original);
      assertEquals(original.urls, ["https://example.com/original"]);
      const audiobook = bookInDb.alternatives.find((alternative) =>
        alternative.name === "audiobook"
      );
      assertExists(audiobook);
      assertEquals(audiobook.urls, [
        "https://example.com/audiobook",
        "https://example.com/audiobook2",
      ]);
    });

    it("deletes book alternatives", async () => {
      const pool = await getOrCreateDatabasePool();
      const book = await createBook(pool, {
        title: "The Hobbit",
        year: 1937,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [
          {
            name: "original",
            urls: ["https://example.com"],
          },
        ],
      });

      await updateBook(pool, book.id, {
        alternatives: [],
      });

      const bookInDb = await getBookById(pool, book.id);
      assertEquals(bookInDb.alternatives.length, 0);
    });

    it("throws an error if the book does not exist", async () => {
      const pool = await getOrCreateDatabasePool();
      await assertRejects(
        async () =>
          await updateBook(pool, "01959eb7-34e3-7868-8c24-c6fa64188453", {
            title: "The Hobbit",
          }),
        EntityNotFoundException,
      );
    });

    it("throws an error if no properties are provided", async () => {
      const pool = await getOrCreateDatabasePool();
      await assertRejects(
        async () =>
          await updateBook(pool, "01959eb7-34e3-7868-8c24-c6fa64188453", {}),
        InvalidArgumentException,
      );
    });
  });

  describe("deleteBook", () => {
    it("deletes a book", async () => {
      const pool = await getOrCreateDatabasePool();
      const book = await createBook(pool, {
        title: "The Hobbit",
        year: 1937,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
      });

      await deleteBook(pool, book.id);

      await assertRejects(
        async () => await getBookById(pool, book.id),
        EntityNotFoundException,
      );
    });
  });
});
