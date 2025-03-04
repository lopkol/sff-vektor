import "@/config/env.ts";

const { runDbmate } = await import("@/config/migrations.ts");

await runDbmate(Deno.args[0], Deno.args.slice(1));
