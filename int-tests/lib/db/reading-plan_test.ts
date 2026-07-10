import { assertEquals, assertExists } from "@std/assert";
import { afterAll, afterEach, beforeAll, describe, it } from "@std/testing/bdd";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";
import { clearDatabase } from "@/setup/clear_database.ts";
import { seedReadingPlan } from "@/setup/seed.ts";
import {
  type Author,
  type BookWithReadingPlan,
  createAuthor,
  createBook,
  createBookList,
  createReader,
  Genre,
  getApprovedBooksWithReadingPlan,
  getOrCreateDatabasePool,
  getReadingPlan,
  isReaderOfBookList,
  ReadingPlanStatus,
  upsertReadingPlan,
} from "@sffvektor/lib";
import type { CommonQueryMethods } from "slonik";

async function createBookWithAuthor(
  db: CommonQueryMethods,
  props: {
    title: string;
    isApproved: boolean;
    author: Author;
    year?: number;
    genre?: Genre;
  },
) {
  return await createBook(db, {
    title: props.title,
    year: props.year ?? 2024,
    genre: props.genre ?? Genre.Fantasy,
    isApproved: props.isApproved,
    isPending: false,
    alternatives: [],
    authors: [props.author.id],
  });
}

describe("reading plan db functions", () => {
  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("isReaderOfBookList", () => {
    it("returns true when the reader is assigned to the book list", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader = await createReader(pool, {
        molyUsername: "r1",
        molyUrl: "https://example.com/r1",
      });
      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/list",
        pendingUrl: null,
        readers: [reader.id],
      });

      assertEquals(
        await isReaderOfBookList(pool, 2024, Genre.Fantasy, reader.id),
        true,
      );
    });

    it("returns false when the reader is not assigned to the book list", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader = await createReader(pool, {
        molyUsername: "r1",
        molyUrl: "https://example.com/r1",
      });
      const otherReader = await createReader(pool, {
        molyUsername: "r2",
        molyUrl: "https://example.com/r2",
      });
      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/list",
        pendingUrl: null,
        readers: [reader.id],
      });

      assertEquals(
        await isReaderOfBookList(pool, 2024, Genre.Fantasy, otherReader.id),
        false,
      );
    });
  });

  describe("getApprovedBooksWithReadingPlan", () => {
    it("returns only fully-approved books with the reader's status", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader = await createReader(pool, {
        molyUsername: "r1",
        molyUrl: "https://example.com/r1",
      });
      const approvedAuthor = await createAuthor(pool, {
        displayName: "Approved Author",
        sortName: "Approved Author",
        isApproved: true,
      });
      const unapprovedAuthor = await createAuthor(pool, {
        displayName: "Unapproved Author",
        sortName: "Unapproved Author",
        isApproved: false,
      });

      // fully approved, has a plan
      const planned = await createBookWithAuthor(pool, {
        title: "Planned",
        isApproved: true,
        author: approvedAuthor,
      });
      // fully approved, no plan yet
      const noPlan = await createBookWithAuthor(pool, {
        title: "No plan",
        isApproved: true,
        author: approvedAuthor,
      });
      // book itself not approved -> excluded
      await createBookWithAuthor(pool, {
        title: "Book not approved",
        isApproved: false,
        author: approvedAuthor,
      });
      // approved book but author not approved -> excluded
      await createBookWithAuthor(pool, {
        title: "Author not approved",
        isApproved: true,
        author: unapprovedAuthor,
      });

      await seedReadingPlan({
        readerId: reader.id,
        bookId: planned.id,
        status: ReadingPlanStatus.WillRead,
      });

      const result = await getApprovedBooksWithReadingPlan(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        readerId: reader.id,
      });

      assertEquals(result.length, 2);
      const byId = (id: string) =>
        result.find((b: BookWithReadingPlan) => b.id === id);
      assertExists(byId(planned.id));
      assertExists(byId(noPlan.id));
      assertEquals(
        byId(planned.id)?.readingPlanStatus,
        ReadingPlanStatus.WillRead,
      );
      assertEquals(byId(noPlan.id)?.readingPlanStatus, null);
    });

    it("only reflects the given reader's plan, not other readers'", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader = await createReader(pool, {
        molyUsername: "r1",
        molyUrl: "https://example.com/r1",
      });
      const otherReader = await createReader(pool, {
        molyUsername: "r2",
        molyUrl: "https://example.com/r2",
      });
      const author = await createAuthor(pool, {
        displayName: "Author",
        sortName: "Author",
        isApproved: true,
      });
      const book = await createBookWithAuthor(pool, {
        title: "Book",
        isApproved: true,
        author,
      });

      await seedReadingPlan({
        readerId: otherReader.id,
        bookId: book.id,
        status: ReadingPlanStatus.Read,
      });

      const result = await getApprovedBooksWithReadingPlan(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        readerId: reader.id,
      });

      assertEquals(result.length, 1);
      assertEquals(result[0].readingPlanStatus, null);
    });
  });

  describe("upsertReadingPlan", () => {
    it("inserts a new reading plan", async () => {
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
      const book = await createBookWithAuthor(pool, {
        title: "Book",
        isApproved: true,
        author,
      });

      await upsertReadingPlan(pool, {
        readerId: reader.id,
        bookId: book.id,
        status: ReadingPlanStatus.WillRead,
      });

      const plan = await getReadingPlan(pool, reader.id, book.id);
      assertExists(plan);
      assertEquals(plan?.status, ReadingPlanStatus.WillRead);
    });

    it("updates the status of an existing plan", async () => {
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
      const book = await createBookWithAuthor(pool, {
        title: "Book",
        isApproved: true,
        author,
      });
      await seedReadingPlan({
        readerId: reader.id,
        bookId: book.id,
        status: ReadingPlanStatus.WillRead,
      });

      await upsertReadingPlan(pool, {
        readerId: reader.id,
        bookId: book.id,
        status: ReadingPlanStatus.Read,
      });

      const plan = await getReadingPlan(pool, reader.id, book.id);
      assertEquals(plan?.status, ReadingPlanStatus.Read);
    });

    it("keeps the row (does not delete) when set to noPlan", async () => {
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
      const book = await createBookWithAuthor(pool, {
        title: "Book",
        isApproved: true,
        author,
      });
      await seedReadingPlan({
        readerId: reader.id,
        bookId: book.id,
        status: ReadingPlanStatus.Read,
      });

      await upsertReadingPlan(pool, {
        readerId: reader.id,
        bookId: book.id,
        status: ReadingPlanStatus.NoPlan,
      });

      const plan = await getReadingPlan(pool, reader.id, book.id);
      assertExists(plan);
      assertEquals(plan?.status, ReadingPlanStatus.NoPlan);
    });

    it("promotes an existing manual status to molyRead (sync promote)", async () => {
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
      const book = await createBookWithAuthor(pool, {
        title: "Book",
        isApproved: true,
        author,
      });
      await seedReadingPlan({
        readerId: reader.id,
        bookId: book.id,
        status: ReadingPlanStatus.WillRead,
      });

      await upsertReadingPlan(pool, {
        readerId: reader.id,
        bookId: book.id,
        status: ReadingPlanStatus.MolyRead,
      });

      const plan = await getReadingPlan(pool, reader.id, book.id);
      assertEquals(plan?.status, ReadingPlanStatus.MolyRead);
    });

    it("downgrades a molyRead status to noPlan (sync downgrade)", async () => {
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
      const book = await createBookWithAuthor(pool, {
        title: "Book",
        isApproved: true,
        author,
      });
      await seedReadingPlan({
        readerId: reader.id,
        bookId: book.id,
        status: ReadingPlanStatus.MolyRead,
      });

      await upsertReadingPlan(pool, {
        readerId: reader.id,
        bookId: book.id,
        status: ReadingPlanStatus.NoPlan,
      });

      const plan = await getReadingPlan(pool, reader.id, book.id);
      assertEquals(plan?.status, ReadingPlanStatus.NoPlan);
    });
  });
});
