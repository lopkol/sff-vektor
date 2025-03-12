import { assertEquals, assertRejects } from "@std/assert";
import { afterAll, afterEach, beforeAll, describe, it } from "@std/testing/bdd";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";
import {
  createUser,
  EntityNotFoundException,
  getOrCreateDatabasePool,
  getUserByEmail,
  getUserById,
  sql,
  UniqueConstraintException,
  UserRole,
} from "@sffvektor/lib";
import { z } from "zod";
import { clearDatabase } from "@/setup/clear_database.ts";

describe("user db functions", () => {
  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await teardown();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe("getUserById", () => {
    it("throws an error if the user does not exist", async () => {
      const pool = await getOrCreateDatabasePool();

      await assertRejects(
        async () =>
          await getUserById(pool, "01958c19-c7c9-79f3-a1bf-44de302ee617"),
        EntityNotFoundException,
      );
    });

    it("returns the user if it exists", async () => {
      const pool = await getOrCreateDatabasePool();
      const user = await createUser(pool, {
        email: "test@test.com",
        role: UserRole.Admin,
        isActive: true,
      });

      const fetchedUser = await getUserById(pool, user.id);

      assertEquals(fetchedUser.id, user.id);
      assertEquals(fetchedUser.email, "test@test.com");
      assertEquals(fetchedUser.role, UserRole.Admin);
      assertEquals(fetchedUser.isActive, true);
    });
  });

  describe("getUserByEmail", () => {
    it("throws an error if the user does not exist", async () => {
      const pool = await getOrCreateDatabasePool();

      await assertRejects(
        async () => await getUserByEmail(pool, "test@test.com"),
        EntityNotFoundException,
      );
    });

    it("returns the user if it exists", async () => {
      const pool = await getOrCreateDatabasePool();
      await createUser(pool, {
        email: "test@test.com",
        role: UserRole.Admin,
        isActive: true,
      });

      const fetchedUser = await getUserByEmail(pool, "test@test.com");

      assertEquals(fetchedUser.email, "test@test.com");
      assertEquals(fetchedUser.role, UserRole.Admin);
      assertEquals(fetchedUser.isActive, true);
    });
  });

  describe("createUser", () => {
    it("creates a user (without reader data)", async () => {
      const pool = await getOrCreateDatabasePool();

      const user = await createUser(pool, {
        email: "vader@sith.com",
        name: "Darth Vader",
        role: UserRole.Admin,
        isActive: true,
      });

      const createdUser = await getUserById(pool, user.id);
      assertEquals(createdUser.email, "vader@sith.com");
      assertEquals(createdUser.name, "Darth Vader");
      assertEquals(createdUser.role, UserRole.Admin);
      assertEquals(createdUser.isActive, true);
      assertEquals(createdUser.molyUsername, null);
      assertEquals(createdUser.molyUrl, null);
    });

    it("creates a user (with reader data)", async () => {
      const pool = await getOrCreateDatabasePool();

      const user = await createUser(pool, {
        email: "vader@sith.com",
        name: "Darth Vader",
        role: UserRole.Admin,
        isActive: true,
        molyUsername: "vader",
        molyUrl: "url",
      });

      const createdUser = await getUserById(pool, user.id);
      assertEquals(createdUser.email, "vader@sith.com");
      assertEquals(createdUser.name, "Darth Vader");
      assertEquals(createdUser.role, UserRole.Admin);
      assertEquals(createdUser.isActive, true);
      assertEquals(createdUser.molyUsername, "vader");
      assertEquals(createdUser.molyUrl, "url");
    });

    it("throws an error if a user with the same email already exists", async () => {
      const pool = await getOrCreateDatabasePool();
      await createUser(pool, {
        email: "vader@sith.com",
        role: UserRole.Admin,
        isActive: true,
      });

      await assertRejects(
        async () =>
          await createUser(pool, {
            email: "vader@sith.com",
            role: UserRole.User,
            isActive: true,
          }),
        UniqueConstraintException,
      );
    });

    it("creates a user and assigns an existing reader to it if the molyUsername already exists", async () => {
      const pool = await getOrCreateDatabasePool();
      const readerResult = await pool.query(
        sql.type(z.object({ id: z.string() }))`
        insert into reader (moly_username, moly_url)
        values ('vader', 'url')
        returning id;
      `,
      );
      const readerId = readerResult.rows[0].id;

      const user = await createUser(pool, {
        email: "vader@sith.com",
        name: "Darth Vader",
        role: UserRole.Admin,
        isActive: true,
        molyUsername: "vader",
        molyUrl: "new-url",
      });

      const createdUser = await getUserById(pool, user.id);
      assertEquals(createdUser.email, "vader@sith.com");
      assertEquals(createdUser.molyUsername, "vader");
      assertEquals(createdUser.molyUrl, "new-url");
      const readerInDb = await pool.query(
        sql.type(
          z.object({
            id: z.string(),
            moly_username: z.string(),
            moly_url: z.string(),
          }),
        )`
        select id, moly_username, moly_url from reader where moly_username = 'vader';
        `,
      );
      assertEquals(readerInDb.rows[0].id, readerId);
      assertEquals(readerInDb.rows[0].moly_username, "vader");
      assertEquals(readerInDb.rows[0].moly_url, "new-url");
    });
  });
});
