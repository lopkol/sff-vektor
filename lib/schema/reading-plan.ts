import { z } from "zod";

export enum ReadingPlanStatus {
  Read = "read",
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

export const setReadingPlanSchema = z.object({
  bookId: z.string(),
  status: z.enum(ReadingPlanStatus),
});

export type SetReadingPlan = z.infer<typeof setReadingPlanSchema>;
