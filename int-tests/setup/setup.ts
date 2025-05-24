import { getOrCreateDatabasePool, loadEnv, setupLogger } from "@sffvektor/lib";

export async function setup() {
  // Disable logs unless it's a fatal error
  await setupLogger({
    level: "fatal",
  });

  await loadEnv();

  await getOrCreateDatabasePool();
}
