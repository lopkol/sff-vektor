import { app } from "@/config/application.ts";

app.get("/health", (c) => {
  return c.json({ status: "OK" });
});
