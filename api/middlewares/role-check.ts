import { createMiddleware } from "hono/factory";
import { UserRole } from "@sffvektor/lib";

const createUserRoleCheckMiddleware = (role: UserRole) =>
  createMiddleware(async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 403);
    }
    if (user.role !== role) {
      return c.json({ error: "Unauthorized" }, 403);
    }
    await next();
  });

export const isUserAdminMiddleware = createUserRoleCheckMiddleware(
  UserRole.Admin,
);
