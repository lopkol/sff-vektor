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

beforeAll(async () => {
  await setup();
});

afterAll(async () => {
  await teardown();
});

describe(() => {
  beforeEach(async () => {
    // Add soemthing in DB...
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it("runs the example correctly", async () => {
    const pool = await getOrCreateDatabasePool();
    const dummyQuery = await pool.query(sql.type(z.object({ id: z.number() }))`
      SELECT 1 AS id
    `);
    assertEquals(dummyQuery.rows[0].id === 1, true);
  });
});
