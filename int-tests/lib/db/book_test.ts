import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { afterAll, afterEach, beforeAll, describe, it } from "@std/testing/bdd";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";
import { clearDatabase } from "@/setup/clear_database.ts";
import {
  createAuthor,
  createBook,
  deleteBook,
  EntityNotFoundException,
  Genre,
  getBookById,
  getBookByMolyId,
  getBookByUrl,
  getBooks,
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
    it("creates a book (without alternatives and authors)", async () => {
      const pool = await getOrCreateDatabasePool();

      const book = await createBook(pool, {
        molyId: "123",
        title: "The Hobbit",
        year: 1937,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [],
      });

      const bookInDb = await getBookById(pool, book.id);
      assertEquals(bookInDb.molyId, "123");
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
        authors: [],
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

    it("links authors to the book", async () => {
      const pool = await getOrCreateDatabasePool();
      const author = await createAuthor(pool, {
        displayName: "J.R.R. Tolkien",
        sortName: "Tolkien, J.R.R.",
        isApproved: true,
      });

      const book = await createBook(pool, {
        title: "The Hobbit",
        year: 1937,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author.id],
      });

      const bookInDb = await getBookById(pool, book.id);
      assertEquals(bookInDb.authors.length, 1);
      assertEquals(bookInDb.authors[0], author.id);
    });

    it("throws an error if the author id is invalid", async () => {
      const pool = await getOrCreateDatabasePool();
      await assertRejects(
        async () =>
          await createBook(pool, {
            title: "The Hobbit",
            year: 1937,
            genre: Genre.Fantasy,
            series: "The Hobbit",
            seriesNumber: "1",
            isApproved: true,
            isPending: false,
            alternatives: [],
            authors: ["invalid-author-id"],
          }),
        InvalidArgumentException,
      );
    });

    it("throws an error if the author does not exist", async () => {
      const pool = await getOrCreateDatabasePool();

      await assertRejects(
        async () =>
          await createBook(pool, {
            title: "The Hobbit",
            year: 1937,
            genre: Genre.Fantasy,
            series: "The Hobbit",
            seriesNumber: "1",
            isApproved: true,
            isPending: false,
            alternatives: [],
            authors: ["01959eb7-34e3-7868-8c24-c6fa64188453"],
          }),
        EntityNotFoundException,
      );
    });
  });

  describe("getBooks", () => {
    it("returns books of a year", async () => {
      const pool = await getOrCreateDatabasePool();
      const author1 = await createAuthor(pool, {
        displayName: "J.R.R. Tolkien",
        sortName: "Tolkien, J.R.R.",
        isApproved: true,
      });
      const author2 = await createAuthor(pool, {
        displayName: "J.K. Rowling",
        sortName: "Rowling, J.K.",
        isApproved: false,
      });
      const author3 = await createAuthor(pool, {
        displayName: "C.S. Lewis",
        sortName: "Lewis, C.S.",
        isApproved: true,
      });
      const book1 = await createBook(pool, {
        title: "The Hobbit",
        year: 2005,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author1.id],
      });
      const book2 = await createBook(pool, {
        title: "Harry Potter and the Philosopher's Stone",
        year: 2005,
        genre: Genre.Fantasy,
        series: "Harry Potter",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author2.id],
      });
      const book3 = await createBook(pool, {
        title: "The Lion, the Witch and the Wardrobe",
        year: 2002,
        genre: Genre.Fantasy,
        series: "The Chronicles of Narnia",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author3.id],
      });

      const books = await getBooks(pool, {
        year: 2005,
      });

      assertEquals(books.length, 2);
      assertEquals(books[0].id, book2.id);
      assertEquals(books[1].id, book1.id);
    });

    it("returns books of a year and genre", async () => {
      const pool = await getOrCreateDatabasePool();
      const author1 = await createAuthor(pool, {
        displayName: "J.R.R. Tolkien",
        sortName: "Tolkien, J.R.R.",
        isApproved: true,
      });
      const author2 = await createAuthor(pool, {
        displayName: "J.K. Rowling",
        sortName: "Rowling, J.K.",
        isApproved: true,
      });
      const author3 = await createAuthor(pool, {
        displayName: "C.S. Lewis",
        sortName: "Lewis, C.S.",
        isApproved: true,
      });
      const book1 = await createBook(pool, {
        title: "The Hobbit",
        year: 2005,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author1.id],
      });
      const book2 = await createBook(pool, {
        title: "Harry Potter and the Philosopher's Stone",
        year: 2005,
        genre: Genre.SciFi,
        series: "Harry Potter",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author2.id],
      });
      const book3 = await createBook(pool, {
        title: "The Lion, the Witch and the Wardrobe",
        year: 2005,
        genre: Genre.Fantasy,
        series: "The Chronicles of Narnia",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author3.id],
      });

      const books = await getBooks(pool, {
        year: 2005,
        genre: Genre.Fantasy,
      });

      assertEquals(books.length, 2);
      assertEquals(books[0].id, book3.id);
      assertEquals(books[1].id, book1.id);
    });

    it("returns books correctly sorted", async () => {
      const pool = await getOrCreateDatabasePool();
      const author1 = await createAuthor(pool, {
        displayName: "Jack Black",
        sortName: "Black, Jack",
        isApproved: true,
      });
      const author2 = await createAuthor(pool, {
        displayName: "John Doe",
        sortName: "Doe, John",
        isApproved: true,
      });
      const author3 = await createAuthor(pool, {
        displayName: "C.S. Lewis",
        sortName: "Lewis, C.S.",
        isApproved: true,
      });
      const author4 = await createAuthor(pool, {
        displayName: "Arthur Lewis",
        sortName: "Lewis, Arthur",
        isApproved: true,
      });
      const author5 = await createAuthor(pool, {
        displayName: "J.R.R. Tolkien",
        sortName: "Tolkien, J.R.R.",
        isApproved: true,
      });
      const book1 = await createBook(pool, {
        title: "The Hobbit",
        year: 2005,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author4.id, author5.id],
      });
      const book2 = await createBook(pool, {
        title: "Harry Potter and the Philosopher's Stone",
        year: 2005,
        genre: Genre.Fantasy,
        series: "Harry Potter",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author2.id],
      });
      const book3 = await createBook(pool, {
        title: "The Lion, the Witch and the Wardrobe",
        year: 2005,
        genre: Genre.Fantasy,
        series: "The Chronicles of Narnia",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author3.id],
      });
      const book4 = await createBook(pool, {
        title: "The Hobbit",
        year: 2005,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author2.id, author3.id],
      });
      const book5 = await createBook(pool, {
        title: "The Hobbit",
        year: 2005,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author2.id, author4.id],
      });
      const book6 = await createBook(pool, {
        title: "The Hobbit",
        year: 2005,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author1.id, author2.id],
      });
      const book7 = await createBook(pool, {
        title: "Angels and Demons",
        year: 2005,
        genre: Genre.Fantasy,
        series: null,
        seriesNumber: null,
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author3.id],
      });

      const books = await getBooks(pool, {
        year: 2005,
        genre: Genre.Fantasy,
      });

      assertEquals(books.length, 7);
      assertEquals(books[0].id, book6.id);
      assertEquals(books[1].id, book2.id);
      assertEquals(books[2].id, book5.id);
      assertEquals(books[3].id, book4.id);
      assertEquals(books[4].id, book1.id);
      assertEquals(books[5].id, book7.id);
      assertEquals(books[6].id, book3.id);
    });

    it("returns the book urls of the alternative 'magyar'", async () => {
      const pool = await getOrCreateDatabasePool();
      const author = await createAuthor(pool, {
        displayName: "J.R.R. Tolkien",
        sortName: "Tolkien, J.R.R.",
        isApproved: true,
      });
      await createBook(pool, {
        title: "The Hobbit",
        year: 2005,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [
          {
            name: "eredeti",
            urls: ["https://example.com/original"],
          },
          {
            name: "magyar",
            urls: ["https://example.com/magyar"],
          },
        ],
        authors: [author.id],
      });
      await createBook(pool, {
        title: "The Lord of the Rings",
        year: 2005,
        genre: Genre.Fantasy,
        series: "The Lord of the Rings",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [
          {
            name: "magyar",
            urls: [
              "https://example.com/magyar2",
              "https://example.com/magyar3",
            ],
          },
        ],
        authors: [author.id],
      });

      const books = await getBooks(pool, {
        year: 2005,
        genre: Genre.Fantasy,
      });

      assertEquals(books.length, 2);
      assertEquals(books[0].urls, ["https://example.com/magyar"]);
      assertEquals(books[1].urls, [
        "https://example.com/magyar2",
        "https://example.com/magyar3",
      ]);
    });

    it("calculates isApproved correctly: if book and all authors are approved, returns true", async () => {
      const pool = await getOrCreateDatabasePool();
      const author1 = await createAuthor(pool, {
        displayName: "J.R.R. Tolkien",
        sortName: "Tolkien, J.R.R.",
        isApproved: true,
      });
      const author2 = await createAuthor(pool, {
        displayName: "C.S. Lewis",
        sortName: "Lewis, C.S.",
        isApproved: true,
      });
      await createBook(pool, {
        title: "The Hobbit",
        year: 2005,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author1.id, author2.id],
      });

      const books = await getBooks(pool, {
        year: 2005,
        genre: Genre.Fantasy,
      });

      assertEquals(books[0].isApproved, true);
    });

    it("calculates isApproved correctly: if book is approved but some authors are not, returns false", async () => {
      const pool = await getOrCreateDatabasePool();
      const author1 = await createAuthor(pool, {
        displayName: "J.R.R. Tolkien",
        sortName: "Tolkien, J.R.R.",
        isApproved: true,
      });
      const author2 = await createAuthor(pool, {
        displayName: "C.S. Lewis",
        sortName: "Lewis, C.S.",
        isApproved: false,
      });
      await createBook(pool, {
        title: "The Hobbit",
        year: 2005,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author1.id, author2.id],
      });

      const books = await getBooks(pool, {
        year: 2005,
        genre: Genre.Fantasy,
      });

      assertEquals(books[0].isApproved, false);
    });

    it("calculates isApproved correctly: if book is not approved, returns false", async () => {
      const pool = await getOrCreateDatabasePool();
      const author1 = await createAuthor(pool, {
        displayName: "J.R.R. Tolkien",
        sortName: "Tolkien, J.R.R.",
        isApproved: true,
      });
      await createBook(pool, {
        title: "The Hobbit",
        year: 2005,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: false,
        isPending: false,
        alternatives: [],
        authors: [author1.id],
      });

      const books = await getBooks(pool, {
        year: 2005,
        genre: Genre.Fantasy,
      });

      assertEquals(books[0].isApproved, false);
    });
  });

  describe("getBookById", () => {
    it("returns a book", async () => {
      const pool = await getOrCreateDatabasePool();
      const author = await createAuthor(pool, {
        displayName: "J.R.R. Tolkien",
        sortName: "Tolkien, J.R.R.",
        isApproved: true,
      });
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
        authors: [author.id],
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
      assertEquals(fetchedBook.authors.length, 1);
      assertEquals(fetchedBook.authors[0], author.id);
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

  describe("getBookByMolyId", () => {
    it("returns a book", async () => {
      const pool = await getOrCreateDatabasePool();
      const author = await createAuthor(pool, {
        displayName: "J.R.R. Tolkien",
        sortName: "Tolkien, J.R.R.",
        isApproved: true,
      });
      await createBook(pool, {
        molyId: "333",
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
        authors: [author.id],
      });

      const fetchedBook = await getBookByMolyId(
        pool,
        "333",
      );

      assertEquals(fetchedBook?.title, "The Hobbit");
    });

    it("returns null if the book does not exist", async () => {
      const pool = await getOrCreateDatabasePool();
      await createBook(pool, {
        molyId: "333",
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
        authors: [],
      });

      const fetchedBook = await getBookByMolyId(
        pool,
        "555",
      );

      assertEquals(fetchedBook, null);
    });
  });

  describe("getBookByUrl", () => {
    it("returns a book", async () => {
      const pool = await getOrCreateDatabasePool();
      const author = await createAuthor(pool, {
        displayName: "J.R.R. Tolkien",
        sortName: "Tolkien, J.R.R.",
        isApproved: true,
      });
      await createBook(pool, {
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
        authors: [author.id],
      });

      const fetchedBook = await getBookByUrl(
        pool,
        "https://example.com/original2",
      );

      assertEquals(fetchedBook?.title, "The Hobbit");
    });

    it("returns null if the book does not exist", async () => {
      const pool = await getOrCreateDatabasePool();
      await createBook(pool, {
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
        authors: [],
      });

      const fetchedBook = await getBookByUrl(
        pool,
        "https://example.com/nonexistent",
      );

      assertEquals(fetchedBook, null);
    });
  });

  describe("updateBook", () => {
    it("updates a book (without alternatives or authors)", async () => {
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
        authors: [],
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
        authors: [],
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
        authors: [],
      });

      await updateBook(pool, book.id, {
        alternatives: [],
      });

      const bookInDb = await getBookById(pool, book.id);
      assertEquals(bookInDb.alternatives.length, 0);
    });

    it("updates book authors", async () => {
      const pool = await getOrCreateDatabasePool();
      const author = await createAuthor(pool, {
        displayName: "J.R.R. Tolkien",
        sortName: "Tolkien, J.R.R.",
        isApproved: true,
      });
      const book = await createBook(pool, {
        title: "The Hobbit",
        year: 1937,
        genre: Genre.Fantasy,
        series: "The Hobbit",
        seriesNumber: "1",
        isApproved: true,
        isPending: false,
        alternatives: [],
        authors: [author.id],
      });
      const newAuthor = await createAuthor(pool, {
        displayName: "J.K. Rowling",
        sortName: "Rowling, J.K.",
        isApproved: true,
      });

      await updateBook(pool, book.id, {
        authors: [newAuthor.id],
      });

      const bookInDb = await getBookById(pool, book.id);
      assertEquals(bookInDb.authors.length, 1);
      assertEquals(bookInDb.authors[0], newAuthor.id);
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

    it("throws an error if an author id is invalid", async () => {
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
        authors: [],
      });

      await assertRejects(
        async () =>
          await updateBook(pool, book.id, {
            authors: ["invalid-author-id"],
          }),
        InvalidArgumentException,
      );
    });

    it("throws an error if an author does not exist", async () => {
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
        authors: [],
      });

      await assertRejects(
        async () =>
          await updateBook(pool, book.id, {
            authors: ["01959eb7-34e3-7868-8c24-c6fa64188453"],
          }),
        EntityNotFoundException,
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
        authors: [],
      });

      await deleteBook(pool, book.id);

      await assertRejects(
        async () => await getBookById(pool, book.id),
        EntityNotFoundException,
      );
    });
  });
});
