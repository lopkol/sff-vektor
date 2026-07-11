import { z } from "zod";

export enum ReadingPlanStatus {
  Read = "read",
  // Locked, sync-only variant of "read": written by the Moly sync, never by
  // users. A row at this status cannot be changed by hand.
  MolyRead = "molyRead",
  WillRead = "willRead",
  WillNotRead = "willNotRead",
  NoPlan = "noPlan",
}

export const readingPlanSchema = z.object({
  readerId: z.string(),
  bookId: z.string(),
  status: z.enum(ReadingPlanStatus),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ReadingPlan = z.infer<typeof readingPlanSchema>;

// Statuses a user is allowed to set by hand. `molyRead` is intentionally
// excluded: only the Moly sync may write it, so a client cannot fake a lock.
export const setReadingPlanSchema = z.object({
  bookId: z.string(),
  status: z.enum([
    ReadingPlanStatus.Read,
    ReadingPlanStatus.WillRead,
    ReadingPlanStatus.WillNotRead,
    ReadingPlanStatus.NoPlan,
  ]),
});

export type SetReadingPlan = z.infer<typeof setReadingPlanSchema>;
