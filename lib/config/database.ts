import { createPool } from "slonik";
import { createPgDriverFactory } from "@slonik/pg-driver";

export async function createDbPool() {
  return await createPool(Deno.env.get("DATABASE_URL")!, {
    driverFactory: createPgDriverFactory(),
  });
}
