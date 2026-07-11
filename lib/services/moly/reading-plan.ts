// @ts-types="npm:@types/jsdom"
import { JSDOM } from "jsdom";
import type { CommonQueryMethods } from "slonik";
import { raxConfig } from "@/config/moly-axios.ts";
import { getOrCreateDatabasePool } from "@/config/database.ts";
import { loginToMoly, type MolyClient } from "@/services/moly/auth.ts";
import { getReadersInBookLists } from "@/db/reader.ts";
import { getBooksWithMolyIdForReader } from "@/db/book.ts";
import {
  getMolyReadPlansForReader,
  upsertReadingPlan,
} from "@/db/reading-plan.ts";
import { ReadingPlanStatus } from "@/schema/reading-plan.ts";
import type { Reader } from "@/schema/reader.ts";
import { logger } from "@/helpers/logger.ts";

export type ReaderSyncCounts = {
  // books in the reader's lists that they have read on Moly (set to molyRead)
  matched: number;
  // previously-synced molyRead rows no longer read on Moly (reset to noPlan)
  downgraded: number;
};

// Applies one reader's freshly-scraped Moly reads to the database:
// - promotes every book in the reader's book lists that they have read on Moly
//   to the locked `molyRead` status (overwriting any manual status);
// - downgrades any previously-synced `molyRead` that is no longer read on Moly
//   back to `noPlan`.
// Manual statuses (willRead/willNotRead/read/noPlan) of books that are not read
// on Moly are left untouched. Runs in a transaction so the reader's plans are
// updated atomically.
export async function applyReadingPlanSyncForReader(
  db: CommonQueryMethods,
  readerId: string,
  molyReadIds: Set<string>,
): Promise<ReaderSyncCounts> {
  return await db.transaction(async (tx) => {
    let matched = 0;
    let downgraded = 0;

    const candidateBooks = await getBooksWithMolyIdForReader(tx, readerId);
    for (const book of candidateBooks) {
      if (molyReadIds.has(book.molyId)) {
        await upsertReadingPlan(tx, {
          readerId,
          bookId: book.id,
          status: ReadingPlanStatus.MolyRead,
        });
        matched++;
      }
    }

    const currentMolyRead = await getMolyReadPlansForReader(tx, readerId);
    for (const plan of currentMolyRead) {
      if (!plan.molyId || !molyReadIds.has(plan.molyId)) {
        await upsertReadingPlan(tx, {
          readerId,
          bookId: plan.bookId,
          status: ReadingPlanStatus.NoPlan,
        });
        downgraded++;
      }
    }

    return { matched, downgraded };
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Pause between readers so we do not hammer Moly from a single IP (which could
// look like scraping and get the server's IP blocked). Read at call time so it
// stays configurable (and can be set to 0 in tests), with +/-25% jitter so the
// request cadence is not perfectly regular (which would itself look automated).
function readerDelayMs(): number {
  const baseMs = Number(Deno.env.get("MOLY_SYNC_READER_DELAY_MS") ?? 3000);
  return Math.round(baseMs * (0.75 + Math.random() * 0.5));
}

// Parses a member's "olvasmánylista-teljes" (full reading list) page, which
// lists only fully-read books. Each read book is an `a.book_selector` whose
// `data-id` is the book's molyId; anything else on the page (breadcrumb, filter
// form, …) is ignored.
function parseReadMolyIds(document: Document): string[] {
  const molyIds: string[] = [];
  document.querySelectorAll("a.book_selector[data-id]").forEach(
    (bookLink: Element) => {
      const molyId = bookLink.getAttribute("data-id");
      if (molyId) {
        molyIds.push(molyId);
      }
    },
  );
  return molyIds;
}

// Fetches a reader's full reading list (a single, non-paginated page listing
// only fully-read books) and returns the set of molyIds they have read.
async function getReadMolyIdsForReader(
  client: MolyClient,
  reader: Reader,
): Promise<Set<string>> {
  const url = `${reader.molyUrl}/olvasmanylista-teljes`;
  try {
    const res = await client.get(url, { raxConfig });
    const { document } = new JSDOM(res.data).window;

    return new Set(parseReadMolyIds(document));
  } catch (error) {
    logger.error("Failed to fetch or parse the Moly reading list", {
      readerId: reader.id,
      url,
      error,
    });
    throw error;
  }
}

export type ReaderSyncResult = {
  readerId: string;
  molyUsername?: string | null;
  // number of read books found on the reader's Moly reading list
  readsOnMoly?: number;
  matched?: number;
  downgraded?: number;
  skipped?: boolean;
  error?: string;
};

export type ReadingPlanSyncResult = {
  readerCount: number;
  readers: ReaderSyncResult[];
};

// Injectable dependencies, so tests can supply a fake Moly client and bypass the
// real login/network. Defaults to the real login for production callers.
export type MolyReadingPlanSyncDeps = {
  login: () => Promise<MolyClient>;
};

// Top-level sync: logs in to Moly once, then for every active reader assigned to
// a book list, reads their Moly reading list and updates their reading plans.
// A reader assigned to several book lists is only fetched once. One reader
// failing does not abort the whole sync. Returns a per-reader summary.
export async function syncReadingPlansFromMoly(
  deps: MolyReadingPlanSyncDeps = { login: loginToMoly },
): Promise<ReadingPlanSyncResult> {
  const db = await getOrCreateDatabasePool();
  const readers = await getReadersInBookLists(db);
  if (!readers.length) {
    logger.info("No readers in book lists to sync reading plans for");
    return { readerCount: 0, readers: [] };
  }

  const client = await deps.login();

  const results: ReaderSyncResult[] = [];
  let isFirstFetch = true;
  for (const reader of readers) {
    if (!reader.molyUrl) {
      logger.warn("Skipping reader without a Moly url", {
        readerId: reader.id,
      });
      results.push({
        readerId: reader.id,
        molyUsername: reader.molyUsername,
        skipped: true,
      });
      continue;
    }
    try {
      // Space out requests (but not before the very first one).
      if (!isFirstFetch) {
        const delayMs = readerDelayMs();
        if (delayMs > 0) {
          await sleep(delayMs);
        }
      }
      isFirstFetch = false;

      const molyReadIds = await getReadMolyIdsForReader(client, reader);
      const { matched, downgraded } = await applyReadingPlanSyncForReader(
        db,
        reader.id,
        molyReadIds,
      );
      logger.info("Synced reading plans from Moly for reader", {
        readerId: reader.id,
        readsOnMoly: molyReadIds.size,
        matched,
        downgraded,
      });
      results.push({
        readerId: reader.id,
        molyUsername: reader.molyUsername,
        readsOnMoly: molyReadIds.size,
        matched,
        downgraded,
      });
    } catch (error) {
      logger.error("Failed to sync reading plans from Moly for reader", {
        readerId: reader.id,
        error,
      });
      results.push({
        readerId: reader.id,
        molyUsername: reader.molyUsername,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { readerCount: results.length, readers: results };
}
