import { createPool, type DatabasePool } from "slonik";
import { createPgDriverFactory } from "@slonik/pg-driver";

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
        parse: (value) => value,
      },
      {
        name: "timestamp",
        parse: (value) => value,
      },
      {
        name: "timestamptz",
        parse: (value) => value,
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
