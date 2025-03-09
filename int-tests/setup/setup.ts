import { loadEnv, getOrCreateDatabasePool } from "@sffvektor/lib";

export async function setup() {
  await loadEnv();

  await getOrCreateDatabasePool();
}
