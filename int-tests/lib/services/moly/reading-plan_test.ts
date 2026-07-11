import { assertEquals } from "@std/assert";
import { afterAll, afterEach, beforeAll, describe, it } from "@std/testing/bdd";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";
import { clearDatabase } from "@/setup/clear_database.ts";
import { seedReadingPlan } from "@/setup/seed.ts";
import {
  applyReadingPlanSyncForReader,
  type Author,
  createAuthor,
  createBook,
  createBookList,
  createReader,
  Genre,
  getOrCreateDatabasePool,
  getReadingPlan,
  type MolyClient,
  ReadingPlanStatus,
  syncReadingPlansFromMoly,
} from "@sffvektor/lib";
import type { CommonQueryMethods } from "slonik";

async function createBookInFantasy2024(
  db: CommonQueryMethods,
  props: { title: string; molyId: string; author: Author },
) {
  return await createBook(db, {
    molyId: props.molyId,
    title: props.title,
    year: 2024,
    genre: Genre.Fantasy,
    isApproved: true,
    isPending: false,
    alternatives: [],
    authors: [props.author.id],
  });
}

// A trimmed, anonymised copy of a member's "olvasmánylista-teljes" page. Each
// read book is an `a.book_selector[data-id]` entry; the breadcrumb link and the
// filter form (with its own non-book anchor) are noise that must be ignored, so
// the parser is exercised for selector specificity too. No real ids or emails.
function readingListHtml(molyIds: string[]): string {
  const entries = molyIds
    .map(
      (molyId) =>
        `<div><a class="book_selector" data-id="${molyId}" rel="modal" href="/konyvek/book-${molyId}/en-es-a-konyv/test_reader">Book ${molyId}</a></div>`,
    )
    .join("");
  return `<div id="content" role="main">
    <div class="breadcrumb"><a href="/tagok/test_reader">Test Reader</a></div>
    <div class="filter_box"><form class="turbo"><a class="filter_close" href="#">reset</a><input name="tags" id="tags"></form></div>
    ${entries}
  </div>`;
}

// Builds a fake Moly client whose GET returns a reading-list page based on which
// reader's url is requested. Records the requested urls so the test can assert
// each reader is fetched exactly once (dedup) and inactive readers are skipped.
function makeFakeMolyClient(readsByUrlPart: Record<string, string[]>) {
  const requestedUrls: string[] = [];
  const client = {
    // deno-lint-ignore no-explicit-any
    get: (url: string): Promise<any> => {
      requestedUrls.push(url);
      const matchedPart = Object.keys(readsByUrlPart).find((part) =>
        url.includes(part)
      );
      const molyIds = matchedPart ? readsByUrlPart[matchedPart] : [];
      return Promise.resolve({
        data: readingListHtml(molyIds),
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      });
    },
  } as unknown as MolyClient;
  return { client, requestedUrls };
}

describe("moly reading plan sync", () => {
  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("applyReadingPlanSyncForReader", () => {
    it("promotes read matches, downgrades stale locks, and leaves manual statuses untouched", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader = await createReader(pool, {
        molyUsername: "r1",
        molyUrl: "https://moly.hu/tagok/r1",
      });
      const author = await createAuthor(pool, {
        displayName: "Author",
        sortName: "Author",
        isApproved: true,
      });

      // read on Moly now -> should be promoted to molyRead
      const promoted = await createBookInFantasy2024(pool, {
        title: "Promoted",
        molyId: "A",
        author,
      });
      // not read on Moly -> manual plan must stay untouched
      const manual = await createBookInFantasy2024(pool, {
        title: "Manual",
        molyId: "B",
        author,
      });
      // locked but no longer read on Moly -> should be downgraded to noPlan
      const stale = await createBookInFantasy2024(pool, {
        title: "Stale",
        molyId: "C",
        author,
      });
      // locked and still read on Moly -> should stay molyRead
      const stillRead = await createBookInFantasy2024(pool, {
        title: "Still read",
        molyId: "D",
        author,
      });

      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/fantasy",
        pendingUrl: null,
        readers: [reader.id],
      });

      await seedReadingPlan({
        readerId: reader.id,
        bookId: promoted.id,
        status: ReadingPlanStatus.WillRead,
      });
      await seedReadingPlan({
        readerId: reader.id,
        bookId: manual.id,
        status: ReadingPlanStatus.WillRead,
      });
      await seedReadingPlan({
        readerId: reader.id,
        bookId: stale.id,
        status: ReadingPlanStatus.MolyRead,
      });
      await seedReadingPlan({
        readerId: reader.id,
        bookId: stillRead.id,
        status: ReadingPlanStatus.MolyRead,
      });

      const counts = await applyReadingPlanSyncForReader(
        pool,
        reader.id,
        new Set(["A", "D"]),
      );

      // A and D matched (promoted/re-affirmed); the stale lock C was downgraded
      assertEquals(counts, { matched: 2, downgraded: 1 });

      assertEquals(
        (await getReadingPlan(pool, reader.id, promoted.id))?.status,
        ReadingPlanStatus.MolyRead,
      );
      assertEquals(
        (await getReadingPlan(pool, reader.id, manual.id))?.status,
        ReadingPlanStatus.WillRead,
      );
      assertEquals(
        (await getReadingPlan(pool, reader.id, stale.id))?.status,
        ReadingPlanStatus.NoPlan,
      );
      assertEquals(
        (await getReadingPlan(pool, reader.id, stillRead.id))?.status,
        ReadingPlanStatus.MolyRead,
      );
    });

    it("creates a molyRead row for a read book that had no plan yet", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader = await createReader(pool, {
        molyUsername: "r1",
        molyUrl: "https://moly.hu/tagok/r1",
      });
      const author = await createAuthor(pool, {
        displayName: "Author",
        sortName: "Author",
        isApproved: true,
      });
      const book = await createBookInFantasy2024(pool, {
        title: "Fresh read",
        molyId: "A",
        author,
      });
      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/fantasy",
        pendingUrl: null,
        readers: [reader.id],
      });

      const counts = await applyReadingPlanSyncForReader(
        pool,
        reader.id,
        new Set(["A"]),
      );

      assertEquals(counts, { matched: 1, downgraded: 0 });
      assertEquals(
        (await getReadingPlan(pool, reader.id, book.id))?.status,
        ReadingPlanStatus.MolyRead,
      );
    });
  });

  describe("syncReadingPlansFromMoly", () => {
    it("syncs each reader in a book list from their mocked Moly reading list, deduped, ignoring unassigned readers", async () => {
      // Disable the inter-reader delay so the test does not actually sleep.
      Deno.env.set("MOLY_SYNC_READER_DELAY_MS", "0");
      try {
        const pool = await getOrCreateDatabasePool();

        // Readers do not need to be linked to a user at all.
        const readerOne = await createReader(pool, {
          molyUsername: "reader_one",
          molyUrl: "https://moly.hu/tagok/reader_one",
        });
        const readerTwo = await createReader(pool, {
          molyUsername: "reader_two",
          molyUrl: "https://moly.hu/tagok/reader_two",
        });
        // not assigned to any book list -> must not be fetched
        await createReader(pool, {
          molyUsername: "unassigned_reader",
          molyUrl: "https://moly.hu/tagok/unassigned_reader",
        });

        const author = await createAuthor(pool, {
          displayName: "Author",
          sortName: "Author",
          isApproved: true,
        });
        const bookX = await createBookInFantasy2024(pool, {
          title: "X",
          molyId: "100",
          author,
        });
        const bookY = await createBookInFantasy2024(pool, {
          title: "Y",
          molyId: "200",
          author,
        });
        const bookZ = await createBookInFantasy2024(pool, {
          title: "Z",
          molyId: "300",
          author,
        });

        await createBookList(pool, {
          year: 2024,
          genre: Genre.Fantasy,
          url: "https://example.com/fantasy",
          pendingUrl: null,
          readers: [readerOne.id, readerTwo.id],
        });
        // reader_one is also on a second list -> must still be fetched only once
        await createBookList(pool, {
          year: 2024,
          genre: Genre.SciFi,
          url: "https://example.com/scifi",
          pendingUrl: null,
          readers: [readerOne.id],
        });

        // reader_one already has a stale lock on Z (not in their Moly reads) ->
        // it should be downgraded to noPlan.
        await seedReadingPlan({
          readerId: readerOne.id,
          bookId: bookZ.id,
          status: ReadingPlanStatus.MolyRead,
        });

        const { client, requestedUrls } = makeFakeMolyClient({
          reader_one: ["100", "200"],
          reader_two: ["300"],
        });

        const result = await syncReadingPlansFromMoly({
          login: () => Promise.resolve(client),
        });

        // reader_one: X and Y promoted, stale Z downgraded
        assertEquals(
          (await getReadingPlan(pool, readerOne.id, bookX.id))?.status,
          ReadingPlanStatus.MolyRead,
        );
        assertEquals(
          (await getReadingPlan(pool, readerOne.id, bookY.id))?.status,
          ReadingPlanStatus.MolyRead,
        );
        assertEquals(
          (await getReadingPlan(pool, readerOne.id, bookZ.id))?.status,
          ReadingPlanStatus.NoPlan,
        );
        // reader_two: Z promoted
        assertEquals(
          (await getReadingPlan(pool, readerTwo.id, bookZ.id))?.status,
          ReadingPlanStatus.MolyRead,
        );

        // reader_one fetched exactly once despite being on two lists
        assertEquals(
          requestedUrls.filter((url) => url.includes("reader_one")).length,
          1,
        );
        // the unassigned reader was never fetched
        assertEquals(
          requestedUrls.some((url) => url.includes("unassigned_reader")),
          false,
        );

        // summary
        assertEquals(result.readerCount, 2);
        const one = result.readers.find((r) => r.readerId === readerOne.id);
        assertEquals(one?.readsOnMoly, 2);
        assertEquals(one?.matched, 2);
        assertEquals(one?.downgraded, 1);
        const two = result.readers.find((r) => r.readerId === readerTwo.id);
        assertEquals(two?.readsOnMoly, 1);
        assertEquals(two?.matched, 1);
        assertEquals(two?.downgraded, 0);
      } finally {
        Deno.env.delete("MOLY_SYNC_READER_DELAY_MS");
      }
    });
  });
});
