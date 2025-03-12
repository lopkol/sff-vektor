import { assertEquals } from "@std/assert";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";
import { getOrCreateDatabasePool, sql } from "@sffvektor/lib";
import { z } from "zod";
import { clearDatabase } from "@/setup/clear_database.ts";

describe("clear database", () => {
  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  beforeEach(async () => {
    const pool = await getOrCreateDatabasePool();
    // Create fake table
    await pool.query(sql.type(z.void())`
      CREATE TABLE IF NOT EXISTS public.test_clear_database (
        "id" integer GENERATED ALWAYS AS IDENTITY,
        "name" text,
        PRIMARY KEY ("id")
      );
    `);
    // Add data to table
    await pool.query(sql.type(z.void())`
      INSERT INTO public.test_clear_database ("name")
      VALUES ('test1'), ('test2');
    `);
  });

  afterEach(async () => {
    const pool = await getOrCreateDatabasePool();
    await pool.query(sql.type(z.void())`
      DROP TABLE IF EXISTS public.test_clear_database;
    `);
  });

  const countResultSchema = z.object({
    count: z.string(),
  });

  it("contains the data in the table when database is not cleared", async () => {
    const pool = await getOrCreateDatabasePool();
    const result = await pool.query(sql.type(countResultSchema)`
      SELECT count(*) FROM public.test_clear_database;
    `);
    assertEquals(result.rows[0].count, "2");
  });

  it("doesn't contain the data in the table when database is cleared", async () => {
    await clearDatabase();

    const pool = await getOrCreateDatabasePool();
    const result = await pool.query(sql.type(countResultSchema)`
      SELECT count(*) FROM public.test_clear_database;
    `);
    assertEquals(result.rows[0].count, "0");
  });
});
