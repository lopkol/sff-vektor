import z from "zod";
import { type CommonQueryMethods, createSqlTag } from "slonik";
import { EntityNotFoundException } from "@/exceptions/entity-not-found.exception.ts";
import {
  type CreateReader,
  type Reader,
  readerSchema,
} from "@/schema/reader.ts";
import type { Genre } from "@/schema/book.ts";
import { mutable } from "@/helpers/type.ts";

const sql = createSqlTag({
  typeAliases: {
    reader: readerSchema,
    void: z.void(),
    exists: z.object({ exists: z.boolean() }),
  },
});

export async function createReader(
  db: CommonQueryMethods,
  props: CreateReader,
): Promise<Reader> {
  const readerResult = await db.query(sql.typeAlias("reader")`
    insert into "reader" ("molyUsername", "molyUrl")
    values (${props.molyUsername ?? null}, ${props.molyUrl ?? null}) returning *
  `);

  return readerResult.rows[0];
}

export async function getReaderById(
  db: CommonQueryMethods,
  id: string,
): Promise<Reader> {
  const readerResult = await db.query(sql.typeAlias("reader")`
    select * from "reader" where "id" = ${id}
  `);
  if (!readerResult.rowCount) {
    throw new EntityNotFoundException("Reader not found", { id });
  }

  return readerResult.rows[0];
}

export async function getAllReaders(
  db: CommonQueryMethods,
): Promise<Reader[]> {
  const readerResult = await db.query(sql.typeAlias("reader")`
    select * from "reader" order by lower("molyUsername") asc
  `);

  return mutable(readerResult.rows);
}

export async function deleteReader(
  db: CommonQueryMethods,
  id: string,
): Promise<void> {
  await db.query(sql.typeAlias("void")`
    delete from "reader" where "id" = ${id}
  `);
}

// Readers that should be synced from Moly: assigned to at least one book list.
// They do not need to be linked to a user (let alone an active one). Each reader
// is returned once, even if assigned to several book lists.
export async function getReadersInBookLists(
  db: CommonQueryMethods,
): Promise<Reader[]> {
  const readerResult = await db.query(sql.typeAlias("reader")`
    select r.* from "reader" r
    where exists (
      select 1 from "book_list_reader" blr where blr."readerId" = r."id"
    )
    order by lower(r."molyUsername") asc
  `);

  return mutable(readerResult.rows);
}

export async function isReaderOfBookList(
  db: CommonQueryMethods,
  year: number,
  genre: Genre,
  readerId: string,
): Promise<boolean> {
  const result = await db.query(sql.typeAlias("exists")`
    select exists (
      select 1 from "book_list_reader"
      where "bookListYear" = ${year}
        and "bookListGenre" = ${genre}
        and "readerId" = ${readerId}
    ) as "exists"
  `);

  return result.rows[0].exists;
}
