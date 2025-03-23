import { assertEquals } from "@std/assert/equals";
import {
  camelToSnakeCase,
  emptyObject,
  enumFromString,
  isUuidv7,
} from "@/helpers/type.ts";
import { describe, it } from "@std/testing/bdd";

enum TestEnum {
  Foo = "foo",
  Bar = "bar",
}

describe("camelToSnakeCase", () => {
  it("converts camelCase to snake_case", () => {
    assertEquals(
      camelToSnakeCase("thisIsAStringInCamelCase"),
      "this_is_a_string_in_camel_case",
    );
  });
});

describe("emptyObject", () => {
  it("returns true for an empty object", () => {
    assertEquals(emptyObject({}), true);
  });

  it("returns true if all the values are undefined", () => {
    assertEquals(
      emptyObject({ a: undefined, b: undefined, c: undefined }),
      true,
    );
  });

  it("returns false if a value is null", () => {
    assertEquals(emptyObject({ a: null }), false);
  });

  it("returns false if a value is 0", () => {
    assertEquals(emptyObject({ a: 0 }), false);
  });

  it("returns false if a value is an empty string", () => {
    assertEquals(emptyObject({ a: "" }), false);
  });

  it("returns false if a value is an empty array", () => {
    assertEquals(emptyObject({ a: [] }), false);
  });

  it("returns true if a value is a string", () => {
    assertEquals(emptyObject({ a: "test" }), false);
  });

  it("returns true if there are several values but not all are undefined", () => {
    assertEquals(emptyObject({ a: undefined, b: "test", c: undefined }), false);
  });
});

describe("enumFromString", () => {
  it("returns the enum value if it exists", () => {
    assertEquals(enumFromString(TestEnum, "bar"), TestEnum.Bar);
  });

  it("returns undefined if the enum value does not exist", () => {
    assertEquals(enumFromString(TestEnum, "baz"), undefined);
  });
});

describe("isUuidv7", () => {
  it("returns true if the uuid is a valid uuidv7", () => {
    assertEquals(isUuidv7("0195c33a-c12c-72ad-b00f-2b95428a458a"), true);
  });

  it("returns false if the uuid is not a valid uuidv7", () => {
    assertEquals(isUuidv7("eb955231-38d5-425f-5577-639042651a42"), false);
  });
});
