import { assertEquals } from "@std/assert/equals";
import { isUniqueConstraintError } from "@/helpers/slonik.ts";
import { describe, it } from "@std/testing/bdd";

describe("isUniqueConstraintError", () => {
  it("returns true if the error is a unique constraint error", () => {
    assertEquals(
      isUniqueConstraintError({
        "cause": {
          "name": "error",
          "severity": "ERROR",
          "code": "23505",
          "schema": "public",
          "table": "user",
          "constraint": "unique_user_email",
        },
      }),
      true,
    );
  });

  it("returns false if the error is not a database error", () => {
    assertEquals(isUniqueConstraintError(new Error("test")), false);
  });

  it("returns false if the error is a database error but has a different code", () => {
    assertEquals(
      isUniqueConstraintError({ "cause": { "code": "23502" } }),
      false,
    );
  });
});
