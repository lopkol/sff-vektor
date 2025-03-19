import { app } from "@/config/application.ts";

/**
 * This API route is used to get the current user's data.
 */
app.get("/api/auth/me", (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return c.json(user, 200);
});
