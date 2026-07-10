import type { CommonQueryMethods } from "slonik";
import { getReadingPlan, upsertReadingPlan } from "@/db/reading-plan.ts";
import { ReadingPlanStatus } from "@/schema/reading-plan.ts";
import { ForbiddenException } from "@/exceptions/forbidden.exception.ts";

// User-facing setter for a reader's own reading plan. A status synced from Moly
// (`molyRead`) is a stronger source of truth than a manual status: once set, the
// reader cannot change it by hand. Only the Moly sync moves a row off
// `molyRead`, via the raw `upsertReadingPlan`.
export async function setReadingPlan(
  db: CommonQueryMethods,
  props: { readerId: string; bookId: string; status: ReadingPlanStatus },
): Promise<void> {
  const current = await getReadingPlan(db, props.readerId, props.bookId);
  if (current?.status === ReadingPlanStatus.MolyRead) {
    throw new ForbiddenException(
      "This reading status was synced from Moly and cannot be changed by hand",
      "READING_PLAN_LOCKED",
    );
  }

  await upsertReadingPlan(db, props);
}
