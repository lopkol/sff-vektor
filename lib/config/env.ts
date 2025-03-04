import { load } from "@std/dotenv";

export async function loadEnv() {
  // Load env files in this specific order
  for (const envPath of [
    "./.env.local",
    "./.env",
    "../.env.local",
    "../.env",
  ]) {
    console.log(
      await load({
        envPath,
        export: true,
      })
    );
  }
}
