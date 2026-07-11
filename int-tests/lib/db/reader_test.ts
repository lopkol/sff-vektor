import { assertEquals, assertRejects } from "@std/assert";
import { afterAll, afterEach, beforeAll, describe, it } from "@std/testing/bdd";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";
import { clearDatabase } from "@/setup/clear_database.ts";
import {
  createBookList,
  createReader,
  createUser,
  deleteReader,
  EntityNotFoundException,
  Genre,
  getAllReaders,
  getOrCreateDatabasePool,
  getReaderById,
  getReadersInBookLists,
  UserRole,
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

  describe("getAllReaders", () => {
    it("returns all readers in alphabetical order by molyUsername", async () => {
      const pool = await getOrCreateDatabasePool();
      await createReader(pool, {
        molyUsername: "bobby",
        molyUrl: "test_url",
      });
      await createReader(pool, {
        molyUsername: "Alice",
        molyUrl: "test_url2",
      });
      await createReader(pool, {
        molyUsername: "Cat",
        molyUrl: "test_url3",
      });

      const result = await getAllReaders(pool);

      assertEquals(result.length, 3);
      assertEquals(result[0].molyUsername, "Alice");
      assertEquals(result[1].molyUsername, "bobby");
      assertEquals(result[2].molyUsername, "Cat");
    });
  });

  describe("getReadersInBookLists", () => {
    it("returns every reader assigned to a book list, deduped across lists, regardless of user link or activeness", async () => {
      const pool = await getOrCreateDatabasePool();

      // active user + reader, assigned to two book lists (dedup check)
      const activeUser = await createUser(pool, {
        email: "active@example.com",
        name: "Active",
        role: UserRole.User,
        isActive: true,
        molyUsername: "active",
        molyUrl: "https://moly.hu/tagok/active",
      });
      // inactive user + reader, assigned to a book list -> still included
      const inactiveUser = await createUser(pool, {
        email: "inactive@example.com",
        name: "Inactive",
        role: UserRole.User,
        isActive: false,
        molyUsername: "inactive",
        molyUrl: "https://moly.hu/tagok/inactive",
      });
      // reader with no user at all, assigned to a book list -> included
      const userlessReader = await createReader(pool, {
        molyUsername: "userless",
        molyUrl: "https://moly.hu/tagok/userless",
      });
      // active user + reader, NOT assigned to any book list -> excluded
      await createUser(pool, {
        email: "unassigned@example.com",
        name: "Unassigned",
        role: UserRole.User,
        isActive: true,
        molyUsername: "unassigned",
        molyUrl: "https://moly.hu/tagok/unassigned",
      });

      await createBookList(pool, {
        year: 2024,
        genre: Genre.Fantasy,
        url: "https://example.com/fantasy",
        pendingUrl: null,
        readers: [
          activeUser.readerId!,
          inactiveUser.readerId!,
          userlessReader.id,
        ],
      });
      await createBookList(pool, {
        year: 2024,
        genre: Genre.SciFi,
        url: "https://example.com/scifi",
        pendingUrl: null,
        readers: [activeUser.readerId!],
      });

      const result = await getReadersInBookLists(pool);

      assertEquals(result.map((reader) => reader.molyUsername), [
        "active",
        "inactive",
        "userless",
      ]);
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
