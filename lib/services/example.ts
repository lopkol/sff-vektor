import { type DatabasePool, createSqlTag } from "slonik";
import z from "zod";

export const sql = createSqlTag({
  typeAliases: {
    example: z.object({
      id: z.number(),
    }),
  },
});

export async function getExample(pool: DatabasePool) {
  const result = await pool.query(sql.typeAlias("example")`
    SELECT 1 AS id
  `);
  return result.rows;
}
