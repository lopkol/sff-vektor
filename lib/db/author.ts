import z from "zod";
import { createSqlTag, type DatabasePoolConnection } from "slonik";
import { InvalidArgumentException } from "@/exceptions/invalid-argument.exception.ts";
import { emptyObject } from "@/helpers/type.ts";
import { updateFragmentFromProps } from "@/helpers/slonik.ts";
import { EntityNotFoundException } from "@/exceptions/entity-not-found.exception.ts";
import {
  type Author,
  authorSchema,
  type CreateAuthor,
  type UpdateAuthor,
} from "@/schema/author.ts";
import { mutable } from "@/helpers/type.ts";

const sql = createSqlTag({
  typeAliases: {
    author: authorSchema,
    void: z.void(),
  },
});

export async function createAuthor(
  connection: DatabasePoolConnection,
  props: CreateAuthor,
): Promise<Author> {
  // deno-fmt-ignore
  const result = await connection.query(sql.typeAlias("author")`
    insert into "author" ("displayName", "sortName", "url", "isApproved")
    values (${props.displayName}, ${props.sortName}, ${props.url || null}, ${props.isApproved}) returning *
  `);

  return result.rows[0];
}

export async function getAuthors(
  connection: DatabasePoolConnection,
): Promise<Author[]> {
  const result = await connection.query(sql.typeAlias("author")`
    select * from "author" order by "sortName"
  `);

  return mutable(result.rows);
}

export async function getAuthorById(
  connection: DatabasePoolConnection,
  id: string,
): Promise<Author> {
  const result = await connection.query(sql.typeAlias("author")`
    select * from "author" where "id" = ${id}
  `);
  if (!result.rowCount) {
    throw new EntityNotFoundException("Author not found", { id });
  }

  return result.rows[0];
}

export async function getAuthorByName(
  connection: DatabasePoolConnection,
  name: string,
): Promise<Author | null> {
  const result = await connection.query(sql.typeAlias("author")`
    select * from "author" where "displayName" = ${name}
  `);
  if (!result.rowCount) {
    return null;
  }
  return result.rows[0];
}

export async function updateAuthor(
  connection: DatabasePoolConnection,
  id: string,
  props: UpdateAuthor,
): Promise<Author> {
  if (emptyObject(props)) {
    throw new InvalidArgumentException("No properties to update");
  }

  const updatedPropsFragment = updateFragmentFromProps(props);

  const result = await connection.query(sql.typeAlias("author")`
    update "author" set ${updatedPropsFragment}, "updatedAt" = now() where "id" = ${id} returning *
  `);
  if (!result.rowCount) {
    throw new EntityNotFoundException("Author not found", { id });
  }

  return result.rows[0];
}

export async function deleteAuthor(
  connection: DatabasePoolConnection,
  id: string,
): Promise<void> {
  await connection.query(sql.typeAlias("void")`
    delete from "author" where "id" = ${id}
  `);
}
