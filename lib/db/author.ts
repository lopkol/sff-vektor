import z from "zod";
import { createSqlTag, type DatabasePoolConnection } from "slonik";
import { InvalidArgumentException } from "@/exceptions/invalid-argument.exception.ts";
import { emptyObject } from "@/helpers/type.ts";
import { updateFragmentFromProps } from "@/helpers/slonik.ts";
import { EntityNotFoundException } from "@/exceptions/entity-not-found.exception.ts";

export interface CreateAuthorProps {
  displayName: string;
  sortName: string;
  isApproved: boolean;
}

export interface AuthorProps extends CreateAuthorProps {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const authorDb = z.object({
  id: z.string(),
  display_name: z.string(),
  sort_name: z.string(),
  is_approved: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

const sql = createSqlTag({
  typeAliases: {
    author: authorDb,
    void: z.void(),
  },
});

export async function createAuthor(
  connection: DatabasePoolConnection,
  props: CreateAuthorProps,
): Promise<AuthorProps> {
  const result = await connection.query(sql.typeAlias("author")`
    insert into "author" ("display_name", "sort_name", "is_approved") values (${props.displayName}, ${props.sortName}, ${props.isApproved}) returning *
  `);
  const author = result.rows[0];

  return {
    id: author.id,
    displayName: author.display_name,
    sortName: author.sort_name,
    isApproved: author.is_approved,
    createdAt: author.created_at,
    updatedAt: author.updated_at,
  };
}

export async function getAuthorById(
  connection: DatabasePoolConnection,
  id: string,
): Promise<AuthorProps> {
  const result = await connection.query(sql.typeAlias("author")`
    select * from "author" where "id" = ${id}
  `);
  if (!result.rowCount) {
    throw new EntityNotFoundException("Author not found", { id });
  }

  const author = result.rows[0];

  return {
    id: author.id,
    displayName: author.display_name,
    sortName: author.sort_name,
    isApproved: author.is_approved,
    createdAt: author.created_at,
    updatedAt: author.updated_at,
  };
}

export async function updateAuthor(
  connection: DatabasePoolConnection,
  id: string,
  props: Partial<CreateAuthorProps>,
): Promise<AuthorProps> {
  if (emptyObject(props)) {
    throw new InvalidArgumentException("No properties to update");
  }

  const updatedPropsFragment = updateFragmentFromProps(props);

  const result = await connection.query(sql.typeAlias("author")`
    update "author" set ${updatedPropsFragment}, updated_at = now() where "id" = ${id} returning *
  `);
  if (!result.rowCount) {
    throw new EntityNotFoundException("Author not found", { id });
  }

  const author = result.rows[0];

  return {
    id: author.id,
    displayName: author.display_name,
    sortName: author.sort_name,
    isApproved: author.is_approved,
    createdAt: author.created_at,
    updatedAt: author.updated_at,
  };
}

export async function deleteAuthor(
  connection: DatabasePoolConnection,
  id: string,
): Promise<void> {
  await connection.query(sql.typeAlias("void")`
    delete from "author" where "id" = ${id}
  `);
}
