import { clearEnv } from "@/setup/utils.ts";
import { stopAndDestroyDatabasePool } from "@sffvektor/lib";

export async function teardown() {
  await stopAndDestroyDatabasePool();
  clearEnv();
}
