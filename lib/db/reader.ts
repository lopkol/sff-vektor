import z from "zod";
import { createSqlTag, type DatabasePoolConnection } from "slonik";
import { EntityNotFoundException } from "@/exceptions/entity-not-found.exception.ts";

export interface CreateReaderProps {
  molyUsername?: string | null;
  molyUrl?: string | null;
}

export interface ReaderProps extends CreateReaderProps {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const readerDb = z.object({
  id: z.string(),
  moly_username: z.string().nullable(),
  moly_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const sql = createSqlTag({
  typeAliases: {
    reader: readerDb,
    void: z.void(),
    id: z.object({
      id: z.string(),
    }),
  },
});

export async function createReader(
  connection: DatabasePoolConnection,
  props: CreateReaderProps,
): Promise<ReaderProps> {
  const readerResult = await connection.query(sql.typeAlias("reader")`
    insert into "reader" ("moly_username", "moly_url")
    values (${props.molyUsername ?? null}, ${props.molyUrl ?? null}) returning *
  `);
  const reader = readerResult.rows[0];
  return {
    id: reader.id,
    molyUsername: reader.moly_username,
    molyUrl: reader.moly_url,
    createdAt: reader.created_at,
    updatedAt: reader.updated_at,
  };
}

export async function getReaderById(
  connection: DatabasePoolConnection,
  id: string,
): Promise<ReaderProps> {
  const readerResult = await connection.query(sql.typeAlias("reader")`
    select * from "reader" where "id" = ${id}
  `);
  if (!readerResult.rowCount) {
    throw new EntityNotFoundException("Reader not found", { id });
  }
  const reader = readerResult.rows[0];
  return {
    id: reader.id,
    molyUsername: reader.moly_username,
    molyUrl: reader.moly_url,
    createdAt: reader.created_at,
    updatedAt: reader.updated_at,
  };
}

export async function deleteReader(
  connection: DatabasePoolConnection,
  id: string,
): Promise<void> {
  await connection.query(sql.typeAlias("void")`
    delete from "reader" where "id" = ${id}
  `);
}
