import { assertEquals } from "@std/assert/equals";
import { camelToSnakeCase } from "@/helpers/string.ts";

Deno.test("camelToSnakeCase", () => {
  assertEquals(
    camelToSnakeCase("thisIsAStringInCamelCase"),
    "this_is_a_string_in_camel_case",
  );
});
