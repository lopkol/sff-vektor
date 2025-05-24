import { loadEnv, runDbmate } from "@sffvektor/lib";
import { setupLogger } from "@sffvektor/lib";

await setupLogger({
  level: "debug",
  prettyPrint: true,
  useColors: true,
});

await loadEnv();

await runDbmate(Deno.args[0], Deno.args.slice(1));
