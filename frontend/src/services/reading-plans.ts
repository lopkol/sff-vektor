import http from "./http";
import { ReadingPlanStatus } from "@/types/reading-plan";

export async function setReadingPlan(
  bookId: string,
  status: ReadingPlanStatus,
): Promise<void> {
  await http.put("/reading-plans", { bookId, status });
}
