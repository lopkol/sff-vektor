import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import {
  getOrCreateDatabasePool,
  isDatabasePoolStarted,
  sql,
} from "@sffvektor/lib";
import { assertEquals } from "@std/assert/equals";
import { z } from "zod";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";

describe("Without setup", () => {
  it("doesn't create a database connection pool nor connect to the database", () => {
    assertEquals(isDatabasePoolStarted(), false);
  });

  it("doesn't load any env variable when setup not imported", () => {
    assertEquals(Deno.env.get("DATABASE_URL") === undefined, true);
  });
});

describe("With setup", () => {
  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  it("loads and sets env correctly", () => {
    assertEquals(Deno.env.get("DATABASE_URL") !== undefined, true);
  });

  it("creates a database connection pool", () => {
    assertEquals(isDatabasePoolStarted(), true);
  });

  it("connects to the database and supports SQL queries", async () => {
    const pool = await getOrCreateDatabasePool();
    const dummyQuery = await pool.query(sql.type(z.object({ id: z.number() }))`
      select 1 as id
    `);
    assertEquals(dummyQuery.rows[0].id === 1, true);
  });
});
