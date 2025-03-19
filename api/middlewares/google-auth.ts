import { createMiddleware } from "hono/factory";
import {
  type GoogleUserTokenInfo,
  verifyGoogleToken,
} from "@/helpers/google.ts";

/**
 * This middleware can be used to authenticate the user from a Google Bearer token (JWT).
 * When applied, this middleware will add the user's token info to the request context.
 *
 * @example
 * ```ts
 * app.get("/some-route", googleAuth, async (c) => {
 *   const { email } = c.get("token"); // Get the email from the token
 *   const user = await getUserByEmail(pool, email);
 *   // do something with the user
 * });
 * ```
 */
export const googleAuth = createMiddleware(async (c, next) => {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return c.json({ error: "Unauthorized: bearer token is required" }, 400);
  }
  try {
    const payload = await verifyGoogleToken(token);
    if (!payload) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("token", payload);
  } catch (error) {
    console.error("Cannot verify google token", error);
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

declare module "hono" {
  interface ContextVariableMap {
    token: GoogleUserTokenInfo;
  }
}
