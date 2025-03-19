import { Hono } from "hono";
import { cors } from "hono/cors";
import { googleAuth } from "@/middlewares/google-auth.ts";
import { loadActiveUser } from "@/middlewares/user.ts";

export const app = new Hono();
app.use(
  "/api/*",
  cors({
    origin: Deno.env.get("WEB_URL") || "http://localhost:3000",
  }),
  googleAuth,
  loadActiveUser
);
