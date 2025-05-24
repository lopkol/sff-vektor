import {
  getOrCreateDatabasePool,
  loadEnv,
  logger,
  type LogLevel,
  runDbmate,
  setupLogger,
} from "@sffvektor/lib";
import { initDefaultAdminUser } from "@/config/init-users.ts";

await setupLogger({
  level: Deno.env.get("LOG_LEVEL") as LogLevel || "debug",
  prettyPrint: ["true", true].includes(
    Deno.env.get("LOG_PRETTY_PRINT") ?? true,
  ),
  useColors: ["true", true].includes(Deno.env.get("LOG_USE_COLORS") ?? true),
});

await loadEnv();
logger.info("Env loaded");

await getOrCreateDatabasePool();
logger.info("Database loaded");

const { app } = await import("@/config/application.ts");
logger.info("App loaded");

await import("@/routes/index.ts");
logger.info("Routes loaded");

Deno.serve({
  port: +(Deno.env.get("PORT") ?? 3000),
  onListen: async ({ hostname, port }) => {
    logger.info(`Server started listening on http://${hostname}:${port}`);
    if (
      [true, "true"].includes(
        Deno.env.get("DATABASE_RUN_MIGRATIONS") ?? "false",
      )
    ) {
      logger.info("Migrations loaded");
      await runDbmate("up", ["--no-dump-schema"]);
    }

    await initDefaultAdminUser();
  },
}, app.fetch);
