import { assertEquals, assertRejects } from "@std/assert";
import { afterAll, afterEach, beforeAll, describe, it } from "@std/testing/bdd";
import { setup } from "@/setup/setup.ts";
import { teardown } from "@/setup/teardown.ts";
import {
  createReader,
  createUser,
  EntityNotFoundException,
  getAllUsers,
  getOrCreateDatabasePool,
  getReaderById,
  getUserByEmail,
  getUserById,
  InvalidArgumentException,
  UniqueConstraintException,
  updateUser,
  UserRole,
  userWithEmailExists,
} from "@sffvektor/lib";
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

  describe("getAllUsers", () => {
    it("returns empty array if there are no users", async () => {
      const pool = await getOrCreateDatabasePool();

      const users = await getAllUsers(pool);

      assertEquals(users.length, 0);
    });

    it("returns all users", async () => {
      const pool = await getOrCreateDatabasePool();
      await createUser(pool, {
        email: "test@test.com",
        role: UserRole.Admin,
        isActive: true,
      });
      await createUser(pool, {
        email: "test2@test.com",
        role: UserRole.User,
        isActive: false,
      });
      await createUser(pool, {
        email: "test3@test.com",
        role: UserRole.User,
        name: "Test User 3",
        molyUsername: "test3",
        molyUrl: "https://test3.com",
        isActive: true,
      });

      const users = await getAllUsers(pool);

      assertEquals(users.length, 3);
    });
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

  describe("userWithEmailExists", () => {
    it("returns false if the user does not exist", async () => {
      const pool = await getOrCreateDatabasePool();

      const exists = await userWithEmailExists(pool, "test@test.com");
      assertEquals(exists, false);
    });

    it("returns true if the user exists", async () => {
      const pool = await getOrCreateDatabasePool();
      await createUser(pool, {
        email: "test@test.com",
        role: UserRole.Admin,
        isActive: true,
      });

      const exists = await userWithEmailExists(pool, "test@test.com");
      assertEquals(exists, true);
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
      const reader = await createReader(pool, {
        molyUsername: "vader",
        molyUrl: "url",
      });

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
      const readerInDb = await getReaderById(pool, reader.id);
      assertEquals(readerInDb.id, reader.id);
      assertEquals(readerInDb.molyUsername, "vader");
      assertEquals(readerInDb.molyUrl, "new-url");
    });
  });

  describe("updateUser", () => {
    it("updates a user", async () => {
      const pool = await getOrCreateDatabasePool();
      const user = await createUser(pool, {
        email: "vader@sith.com",
        role: UserRole.Admin,
        isActive: true,
      });

      await updateUser(pool, user.id, {
        email: "vader_new@sith.com",
        role: UserRole.User,
        isActive: true,
      });

      const updatedUser = await getUserById(pool, user.id);
      assertEquals(updatedUser.email, "vader_new@sith.com");
      assertEquals(updatedUser.role, UserRole.User);
      assertEquals(updatedUser.isActive, true);
    });

    it("throws an error if no properties are provided", async () => {
      const pool = await getOrCreateDatabasePool();
      const user = await createUser(pool, {
        email: "vader@sith.com",
        role: UserRole.Admin,
        isActive: true,
      });

      await assertRejects(
        async () => await updateUser(pool, user.id, {}),
        InvalidArgumentException,
      );
    });

    it("throws an error if a user with the same email already exists", async () => {
      const pool = await getOrCreateDatabasePool();
      await createUser(pool, {
        email: "luke@skywalker.com",
        role: UserRole.Admin,
        isActive: true,
      });
      const user = await createUser(pool, {
        email: "vader@sith.com",
        role: UserRole.Admin,
        isActive: true,
      });

      await assertRejects(
        async () =>
          await updateUser(pool, user.id, { email: "luke@skywalker.com" }),
        UniqueConstraintException,
      );
    });

    it("throws an error if the user does not exist", async () => {
      const pool = await getOrCreateDatabasePool();
      await assertRejects(
        async () =>
          await updateUser(pool, "01958c19-c7c9-79f3-a1bf-44de302ee617", {
            email: "vader@sith.com",
            role: UserRole.Admin,
            isActive: true,
          }),
        EntityNotFoundException,
      );
    });

    it("updates the reader is user already has one", async () => {
      const pool = await getOrCreateDatabasePool();
      const user = await createUser(pool, {
        email: "vader@sith.com",
        role: UserRole.Admin,
        isActive: true,
        molyUsername: "vader",
        molyUrl: "url",
      });

      await updateUser(pool, user.id, {
        molyUsername: "vader_new",
        molyUrl: "new-url",
      });

      const updatedUser = await getUserById(pool, user.id);
      assertEquals(updatedUser.molyUsername, "vader_new");
      assertEquals(updatedUser.molyUrl, "new-url");
    });

    it("creates a reader if the user does not have one", async () => {
      const pool = await getOrCreateDatabasePool();
      const user = await createUser(pool, {
        email: "vader@sith.com",
        role: UserRole.Admin,
        isActive: true,
      });

      await updateUser(pool, user.id, {
        molyUsername: "vader_new",
        molyUrl: "new-url",
      });

      const updatedUser = await getUserById(pool, user.id);
      assertEquals(updatedUser.molyUsername, "vader_new");
      assertEquals(updatedUser.molyUrl, "new-url");
    });
  });
});
