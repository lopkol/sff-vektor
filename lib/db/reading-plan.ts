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

export async function setReadingPlan(
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
