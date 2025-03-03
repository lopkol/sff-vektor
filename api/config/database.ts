import { createPool } from "slonik";
import { createPgDriverFactory } from "@slonik/pg-driver";

export const pool = await createPool(Deno.env.get("DATABASE_URL")!, {
  driverFactory: createPgDriverFactory(),
});
