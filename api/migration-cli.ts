import { loadEnv, runDbmate } from "@sffvektor/lib";

await loadEnv();

await runDbmate(Deno.args[0], Deno.args.slice(1));
