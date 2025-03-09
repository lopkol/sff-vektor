const { loadEnv } = await import("@sffvektor/lib");
await loadEnv();

const { runDbmate } = await import("@sffvektor/lib");

await runDbmate("drop"); // Drop database (if it exists)
await runDbmate("up"); // Create database (if necessary) and migrate to the latest version
