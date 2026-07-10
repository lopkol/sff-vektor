import {
  getOrCreateDatabasePool,
  type ReadingPlanStatus,
} from "@sffvektor/lib";
import { sql } from "slonik";
import z from "zod";

// Inserts a reading_plan row directly, bypassing the business functions, so a
// test can put the database into a known state before exercising the function
// under test.
export async function seedReadingPlan(props: {
  readerId: string;
  bookId: string;
  status: ReadingPlanStatus;
}): Promise<void> {
  const pool = await getOrCreateDatabasePool();
  await pool.query(sql.type(z.void())`
    insert into "reading_plan" ("readerId", "bookId", "status")
    values (${props.readerId}, ${props.bookId}, ${props.status})
  `);
}
