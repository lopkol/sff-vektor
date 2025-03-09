import { getOrCreateDatabasePool } from "@sffvektor/lib";
import { sql } from "slonik";
import z from "zod";

export async function clearDatabase(excludeTables: string[] = []) {
  const excludedTableFragment = excludeTables.length
    ? sql.fragment`
      AND tablename NOT IN (${sql.join(excludeTables, sql.fragment`, `)});
    `
    : sql.fragment``;

  const pool = await getOrCreateDatabasePool();
  await pool.query(sql.type(z.void())`
    do $$ declare
      r record;
    begin
      for r in (select tablename from pg_tables where schemaname = current_schema() ${excludedTableFragment}) loop
          execute 'truncate table ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
      end loop;
    end $$;
  `);
}
