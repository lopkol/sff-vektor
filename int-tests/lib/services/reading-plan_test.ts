import { assertEquals, assertRejects } from "@std/assert";
import { afterAll, afterEach, beforeAll, describe, it } from "@std/testing/bdd";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";
import { clearDatabase } from "@/setup/clear_database.ts";
import { seedReadingPlan } from "@/setup/seed.ts";
import {
  type Author,
  createAuthor,
  createBook,
  createBookList,
  createReader,
  ForbiddenException,
  Genre,
  getOrCreateDatabasePool,
  getReadingPlan,
  ReadingPlanStatus,
  setReadingPlan,
} from "@sffvektor/lib";
import type { CommonQueryMethods } from "slonik";

async function createBookWithAuthor(
  db: CommonQueryMethods,
  props: { title: string; author: Author },
) {
  return await createBook(db, {
    title: props.title,
    year: 2024,
    genre: Genre.Fantasy,
    isApproved: true,
    isPending: false,
    alternatives: [],
    authors: [props.author.id],
  });
}

describe("reading plan service", () => {
  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("setReadingPlan", () => {
    it("inserts a new reading plan when there is no existing row", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader = await createReader(pool, {
        molyUsername: "r1",
        molyUrl: "https://example.com/r1",
      });
      const author = await createAuthor(pool, {
        displayName: "Author",
        sortName: "Author",
        isApproved: true,
      });
      const book = await createBookWithAuthor(pool, { title: "Book", author });

      await setReadingPlan(pool, {
        readerId: reader.id,
        bookId: book.id,
        status: ReadingPlanStatus.WillRead,
      });

      const plan = await getReadingPlan(pool, reader.id, book.id);
      assertEquals(plan?.status, ReadingPlanStatus.WillRead);
    });

    it("updates an existing manual status", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader = await createReader(pool, {
        molyUsername: "r1",
        molyUrl: "https://example.com/r1",
      });
      const author = await createAuthor(pool, {
        displayName: "Author",
        sortName: "Author",
        isApproved: true,
      });
      const book = await createBookWithAuthor(pool, { title: "Book", author });
      await seedReadingPlan({
        readerId: reader.id,
        bookId: book.id,
        status: ReadingPlanStatus.WillRead,
      });

      await setReadingPlan(pool, {
        readerId: reader.id,
        bookId: book.id,
        status: ReadingPlanStatus.Read,
      });

      const plan = await getReadingPlan(pool, reader.id, book.id);
      assertEquals(plan?.status, ReadingPlanStatus.Read);
    });

    it("throws READING_PLAN_LOCKED and keeps the status when the current status is molyRead", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader = await createReader(pool, {
        molyUsername: "r1",
        molyUrl: "https://example.com/r1",
      });
      const author = await createAuthor(pool, {
        displayName: "Author",
        sortName: "Author",
        isApproved: true,
      });
      const book = await createBookWithAuthor(pool, { title: "Book", author });
      // The row is already locked (as a Moly sync would have left it).
      await seedReadingPlan({
        readerId: reader.id,
        bookId: book.id,
        status: ReadingPlanStatus.MolyRead,
      });

      const error = await assertRejects(
        () =>
          setReadingPlan(pool, {
            readerId: reader.id,
            bookId: book.id,
            status: ReadingPlanStatus.WillNotRead,
          }),
        ForbiddenException,
      );
      assertEquals((error as ForbiddenException).code, "READING_PLAN_LOCKED");

      const plan = await getReadingPlan(pool, reader.id, book.id);
      assertEquals(plan?.status, ReadingPlanStatus.MolyRead);
    });

    it("throws BOOK_LIST_ARCHIVED when the book's list is archived", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader = await createReader(pool, {
        molyUsername: "r1",
        molyUrl: "https://example.com/r1",
      });
      const author = await createAuthor(pool, {
        displayName: "Author",
        sortName: "Author",
        isApproved: true,
      });
      const book = await createBookWithAuthor(pool, { title: "Book", author });
      // The book's list (2024, Fantasy) is archived -> frozen.
      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/archived",
        pendingUrl: null,
        archivedAt: "2020-01-01T00:00:00.000Z",
        readers: [reader.id],
      });

      const error = await assertRejects(
        () =>
          setReadingPlan(pool, {
            readerId: reader.id,
            bookId: book.id,
            status: ReadingPlanStatus.WillRead,
          }),
        ForbiddenException,
      );
      assertEquals((error as ForbiddenException).code, "BOOK_LIST_ARCHIVED");

      // no plan row was created
      assertEquals(await getReadingPlan(pool, reader.id, book.id), null);
    });
  });
});
