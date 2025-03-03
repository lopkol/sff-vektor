import "@/config/env.ts";
import { app } from "@/config/application.ts";
import "@/routes/index.ts";

Deno.serve({ port: +(Deno.env.get("PORT") ?? 3000) }, app.fetch);
