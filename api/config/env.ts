import { load } from "@std/dotenv";

// Load env files in this specific order
for (const envPath of ["./.env.local", "./.env", "../.env.local", "../.env"]) {
  await load({
    envPath,
    export: true,
  });
}
