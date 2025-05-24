import { Hono } from "hono";
import { cors } from "hono/cors";
import { googleAuth } from "@/middlewares/google-auth.ts";
import { loadActiveUser } from "@/middlewares/user.ts";
import { requestResponseLogs } from "@/middlewares/logger.ts";
import { handleExceptionMiddleware } from "@/middlewares/map-exceptions.ts";
import { requestId } from "hono/request-id";

export const app = new Hono();
app.use(
  "*",
  requestId(),
  requestResponseLogs({
    disableIncomingRequestLog: true,
  }),
);
app.use(
  "/api/*",
  cors({
    origin: Deno.env.get("WEB_URL") || "http://localhost:3000",
  }),
  googleAuth,
  loadActiveUser,
);
app.onError(handleExceptionMiddleware);
