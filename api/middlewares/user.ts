import { createMiddleware } from "hono/factory";
import {
  getOrCreateDatabasePool,
  getUserByEmail,
  type UserProps,
} from "@sffvektor/lib";

/**
 * This middleware can be used to load the active user from the database.
 * When applied, this middleware will add the user to the request context.
 *
 * @example
 * ```ts
 * app.get("/some-route", googleAuth, loadActiveUser, async (c) => {
 *   const user = c.get("user"); // Get the user from the request context
 *   // do something with the user
 * });
 * ```
 */
export const loadActiveUser = createMiddleware(async (c, next) => {
  const { email } = c.get("token");
  if (!email) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  try {
    const pool = await getOrCreateDatabasePool();
    const user = await getUserByEmail(pool, email);
    if (user.isActive === false) {
      console.error("User is not active", { userId: user.id });
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("user", user);
  } catch (error) {
    console.error("Cannot get user by email", error);
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

declare module "hono" {
  interface ContextVariableMap {
    user: UserProps;
  }
}
