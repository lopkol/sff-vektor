import { assertEquals } from "@std/assert/equals";
import { camelToSnakeCase, emptyObject } from "@/helpers/type.ts";

Deno.test("camelToSnakeCase", () => {
  assertEquals(
    camelToSnakeCase("thisIsAStringInCamelCase"),
    "this_is_a_string_in_camel_case",
  );
});

Deno.test("emptyObject returns true for an empty object", () => {
  assertEquals(emptyObject({}), true);
});

Deno.test("emptyObject returns true if all the values are undefined", () => {
  assertEquals(emptyObject({ a: undefined, b: undefined, c: undefined }), true);
});

Deno.test("emptyObject returns false if a value is null", () => {
  assertEquals(emptyObject({ a: null }), false);
});

Deno.test("emptyObject returns false if a value is 0", () => {
  assertEquals(emptyObject({ a: 0 }), false);
});

Deno.test("emptyObject returns false if a value is an empty string", () => {
  assertEquals(emptyObject({ a: "" }), false);
});

Deno.test("emptyObject returns false if a value is an empty array", () => {
  assertEquals(emptyObject({ a: [] }), false);
});

Deno.test("emptyObject returns true if a value is a string", () => {
  assertEquals(emptyObject({ a: "test" }), false);
});

Deno.test("emptyObject returns true if there are several values but not all are undefined", () => {
  assertEquals(emptyObject({ a: undefined, b: "test", c: undefined }), false);
});
