import {
  createUser,
  getOrCreateDatabasePool,
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
    console.log("No default admin user set, skipping user creation");
    return;
  }
  if (await userWithEmailExists(pool, adminEmail!)) {
    console.log("Default admin user already exists, skipping user creation");
    return;
  }
  await createUser(pool, {
    email: adminEmail,
    name: adminEmail.split("@")[0],
    role: UserRole.Admin,
    isActive: true,
  });
  console.log("Default admin user created");
}
