import { app } from "@/config/application.ts";
import { getAllReaders, getOrCreateDatabasePool } from "@sffvektor/lib";

app.get("/api/readers", async (c) => {
  const pool = await getOrCreateDatabasePool();
  return c.json(await getAllReaders(pool), 200);
});
