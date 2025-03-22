import { sql, type ValueExpression } from "slonik";
import { camelToSnakeCase } from "./type.ts";

/**
 * @param props record of { field: value } pairs
 * @returns a slonik sql fragment containing "field = 'value'" pairs, separated by commas
 */
export function updateFragmentFromProps(
  props: Record<string, ValueExpression | undefined>,
): ReturnType<typeof sql.join> {
  return sql.join(
    Object.entries(props).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc.push(
          sql.fragment`${sql.identifier([camelToSnakeCase(key)])} = ${value}`,
        );
      }
      return acc;
    }, [] as ReturnType<typeof sql.fragment>[]),
    sql.fragment`, `,
  );
}

interface PostgresError {
  code: string;
  schema?: string;
  table?: string;
  column?: string;
  constraint?: string;
  detail?: string;
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

export function isForeignKeyConstraintError(error: unknown): boolean {
  if (error !== null && typeof error === "object" && "cause" in error) {
    const dbError = error as DatabaseError;

    if (dbError.cause?.code === "23503") {
      return true;
    }
  }
  return false;
}

export function getForeignKeyConstraintErrorData(
  error: unknown,
): Record<string, string> | null {
  if (isForeignKeyConstraintError(error)) {
    const dbError = error as DatabaseError;
    if (dbError.cause?.detail) {
      const match = dbError.cause.detail.match(/\(([^)]+)\)/g)?.map((str) =>
        str.slice(1, -1)
      );
      if (match) {
        return { [match[0]]: match[1] };
      }
    }
  }
  return null;
}

export function isInvalidSyntaxError(error: unknown): boolean {
  if (
    error !== null && typeof error === "object" && "message" in error &&
    error.message!.toString().includes("invalid input syntax")
  ) {
    return true;
  }
  return false;
}

export function getInvalidSyntaxErrorData(error: unknown): string | null {
  if (isInvalidSyntaxError(error)) {
    return (error as Error).message.split(":")[1].trim();
  }
  return null;
}
