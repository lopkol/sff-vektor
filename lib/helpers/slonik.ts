import { sql } from "slonik";
import { camelToSnakeCase } from "@/helpers/string.ts";

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
