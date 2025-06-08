import {
  createUser,
  getOrCreateDatabasePool,
  logger,
  UserRole,
  userWithEmailExists,
} from "@sffvektor/lib";

export async function initDefaultAdminUser() {
  const adminEmail = Deno.env.get("DEFAULT_ADMIN_EMAIL");
  const pool = await getOrCreateDatabasePool();
  if (!adminEmail) {
    if (Deno.env.get("APP_ENV") !== "production") {
      throw new Error(
        "DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_USERNAME must be set",
      );
    }
    logger.info("No default admin user set, skipping user creation");
    return;
  }
  if (await userWithEmailExists(pool, adminEmail!)) {
    logger.info("Default admin user already exists, skipping user creation");
    return;
  }
  await createUser(pool, {
    email: adminEmail,
    name: adminEmail.split("@")[0],
    role: UserRole.Admin,
    isActive: true,
  });
  logger.info("Default admin user created");
}
