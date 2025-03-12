import { sql } from "slonik";
import { camelToSnakeCase } from "./type.ts";

/**
 * @param props record of { field: value } pairs
 * @returns a slonik sql fragment containing "field = 'value'" pairs, separated by commas
 */
export function updateFragmentFromProps(
  props: Record<string, string | boolean>,
): ReturnType<typeof sql.join> {
  return sql.join(
    Object.entries(props).map(([key, value]) =>
      sql.fragment`${sql.identifier([camelToSnakeCase(key)])} = ${value}`
    ),
    sql.fragment`, `,
  );
}

interface PostgresError {
  code: string;
  schema?: string;
  table?: string;
  column?: string;
  constraint?: string;
}

interface DatabaseError {
  cause?: PostgresError;
}

export function isUniqueConstraintError(error: unknown): boolean {
  if (error !== null && typeof error === "object" && "cause" in error) {
    const dbError = error as DatabaseError;

    if (dbError.cause?.code === "23505") {
      return true;
    }
  }
  return false;
}
