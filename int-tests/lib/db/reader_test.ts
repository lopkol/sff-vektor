import { assertEquals, assertRejects } from "@std/assert";
import { afterAll, afterEach, beforeAll, describe, it } from "@std/testing/bdd";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";
import { clearDatabase } from "@/setup/clear_database.ts";
import {
  createReader,
  deleteReader,
  EntityNotFoundException,
  getOrCreateDatabasePool,
  getReaderById,
} from "@sffvektor/lib";

describe("reader db functions", () => {
  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("createReader", () => {
    it("creates a reader", async () => {
      const pool = await getOrCreateDatabasePool();

      const reader = await createReader(pool, {
        molyUsername: "test",
        molyUrl: "test_url",
      });

      const readerInDb = await getReaderById(pool, reader.id);
      assertEquals(readerInDb.molyUsername, "test");
      assertEquals(readerInDb.molyUrl, "test_url");
    });
  });

  describe("getReaderById", () => {
    it("fetches a reader", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader = await createReader(pool, {
        molyUsername: "test",
        molyUrl: "test_url",
      });

      const result = await getReaderById(pool, reader.id);

      assertEquals(result.molyUsername, "test");
      assertEquals(result.molyUrl, "test_url");
    });

    it("throws an error if the reader does not exist", async () => {
      const pool = await getOrCreateDatabasePool();
      await assertRejects(
        async () =>
          await getReaderById(pool, "0195bda3-0273-700d-8a4c-a2548e5a5888"),
        EntityNotFoundException,
      );
    });
  });

  describe("deleteReader", () => {
    it("deletes a reader", async () => {
      const pool = await getOrCreateDatabasePool();
      const reader = await createReader(pool, {
        molyUsername: "test",
        molyUrl: "test_url",
      });

      await deleteReader(pool, reader.id);

      await assertRejects(
        async () => await getReaderById(pool, reader.id),
        EntityNotFoundException,
      );
    });
  });
});
