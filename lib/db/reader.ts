import z from "zod";
import { createSqlTag, type DatabasePoolConnection } from "slonik";
import { EntityNotFoundException } from "@/exceptions/entity-not-found.exception.ts";
import {
  type CreateReader,
  type Reader,
  readerSchema,
} from "@/schema/reader.ts";
import { mutable } from "@/helpers/type.ts";

const sql = createSqlTag({
  typeAliases: {
    reader: readerSchema,
    void: z.void(),
  },
});

export async function createReader(
  connection: DatabasePoolConnection,
  props: CreateReader,
): Promise<Reader> {
  const readerResult = await connection.query(sql.typeAlias("reader")`
    insert into "reader" ("molyUsername", "molyUrl")
    values (${props.molyUsername ?? null}, ${props.molyUrl ?? null}) returning *
  `);

  return readerResult.rows[0];
}

export async function getReaderById(
  connection: DatabasePoolConnection,
  id: string,
): Promise<Reader> {
  const readerResult = await connection.query(sql.typeAlias("reader")`
    select * from "reader" where "id" = ${id}
  `);
  if (!readerResult.rowCount) {
    throw new EntityNotFoundException("Reader not found", { id });
  }

  return readerResult.rows[0];
}

export async function getAllReaders(
  connection: DatabasePoolConnection,
): Promise<Reader[]> {
  const readerResult = await connection.query(sql.typeAlias("reader")`
    select * from "reader" order by lower("molyUsername") asc
  `);

  return mutable(readerResult.rows);
}

export async function deleteReader(
  connection: DatabasePoolConnection,
  id: string,
): Promise<void> {
  await connection.query(sql.typeAlias("void")`
    delete from "reader" where "id" = ${id}
  `);
}
