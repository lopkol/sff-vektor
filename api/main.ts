await import("@/config/env.ts");
console.log("env loaded");

await import("@/config/database.ts");
console.log("database loaded");

const { app } = await import("@/config/application.ts");
console.log("app loaded");

if (
  [true, "true"].includes(Deno.env.get("DATABASE_RUN_MIGRATIONS") ?? "false")
) {
  const { runDbmate } = await import("@/config/migrations.ts");
  console.log("migrations loaded");
  await runDbmate("up");
}

await import("@/routes/index.ts");
console.log("routes loaded");

Deno.serve({ port: +(Deno.env.get("PORT") ?? 3000) }, app.fetch);
