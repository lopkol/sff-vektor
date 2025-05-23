import { getOrCreateDatabasePool, loadEnv, runDbmate } from "@sffvektor/lib";
import { initDefaultAdminUser } from "@/config/init-users.ts";

await loadEnv();
console.log("env loaded");

await getOrCreateDatabasePool();
console.log("database loaded");

const { app } = await import("@/config/application.ts");
console.log("app loaded");

if (
  [true, "true"].includes(Deno.env.get("DATABASE_RUN_MIGRATIONS") ?? "false")
) {
  console.log("migrations loaded");
  await runDbmate("up");
}

await import("@/routes/index.ts");
console.log("routes loaded");

await initDefaultAdminUser();

Deno.serve({ port: +(Deno.env.get("PORT") ?? 3000) }, app.fetch);
