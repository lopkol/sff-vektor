import { createPool, type DatabasePool } from "slonik";
import { createPgDriverFactory } from "@sffvektor/slonik-pg-driver";

let globalPool: DatabasePool | undefined;

export function isDatabasePoolStarted() {
  return !!globalPool && globalPool.state().state === "ACTIVE";
}

async function createDatabasePoolAndConnect() {
  return (globalPool = await createPool(Deno.env.get("DATABASE_URL")!, {
    driverFactory: createPgDriverFactory(),
    typeParsers: [
      {
        name: "date",
        parse: (value: unknown) => value,
      },
      {
        name: "timestamp",
        parse: (value: unknown) => value,
      },
      {
        name: "timestamptz",
        parse: (value: unknown) => value,
      },
    ],
  }));
}

export async function getOrCreateDatabasePool() {
  if (globalPool) {
    return globalPool;
  }
  return await createDatabasePoolAndConnect();
}

export async function stopAndDestroyDatabasePool() {
  if (globalPool) {
    await globalPool.end();
  }
  globalPool = undefined;
}
