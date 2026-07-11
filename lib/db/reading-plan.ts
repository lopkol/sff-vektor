import { z } from "zod";
import { type CommonQueryMethods, createSqlTag } from "slonik";
import {
  type ReadingPlan,
  readingPlanSchema,
  type ReadingPlanStatus,
} from "@/schema/reading-plan.ts";

const sql = createSqlTag({
  typeAliases: {
    readingPlan: readingPlanSchema,
    void: z.void(),
    molyReadPlan: z.object({
      bookId: z.string(),
      molyId: z.string().nullable(),
    }),
  },
});

export async function getReadingPlan(
  db: CommonQueryMethods,
  readerId: string,
  bookId: string,
): Promise<ReadingPlan | null> {
  const result = await db.query(sql.typeAlias("readingPlan")`
    select "readerId", "bookId", "status", "createdAt", "updatedAt"
    from "reading_plan"
    where "readerId" = ${readerId} and "bookId" = ${bookId}
  `);

  return result.rowCount ? result.rows[0] : null;
}

// The reader's current molyRead rows together with the book's molyId, so the
// Moly sync can decide which locked statuses are stale (no longer read on Moly)
// and should be downgraded.
export async function getMolyReadPlansForReader(
  db: CommonQueryMethods,
  readerId: string,
): Promise<{ bookId: string; molyId: string | null }[]> {
  const result = await db.query(sql.typeAlias("molyReadPlan")`
    select rp."bookId", b."molyId"
    from "reading_plan" rp
    join "book" b on b."id" = rp."bookId"
    where rp."readerId" = ${readerId} and rp."status" = 'molyRead'
  `);

  return [...result.rows];
}

export async function upsertReadingPlan(
  db: CommonQueryMethods,
  props: { readerId: string; bookId: string; status: ReadingPlanStatus },
): Promise<void> {
  await db.query(sql.typeAlias("void")`
    insert into "reading_plan" ("readerId", "bookId", "status")
    values (${props.readerId}, ${props.bookId}, ${props.status})
    on conflict ("readerId", "bookId")
    do update set "status" = ${props.status}, "updatedAt" = now()
  `);
}
