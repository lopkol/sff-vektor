import { assertEquals } from "@std/assert/equals";
import {
  getForeignKeyConstraintErrorData,
  getInvalidSyntaxErrorData,
  isForeignKeyConstraintError,
  isInvalidSyntaxError,
  isUniqueConstraintError,
} from "@/helpers/slonik.ts";
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

describe("isForeignKeyConstraintError", () => {
  it("returns true if the error is a foreign key constraint error", () => {
    assertEquals(
      isForeignKeyConstraintError({ "cause": { "code": "23503" } }),
      true,
    );
  });

  it("returns false if the error is not a database error", () => {
    assertEquals(isForeignKeyConstraintError(new Error("test")), false);
  });

  it("returns false if the error is a database error but has a different code", () => {
    assertEquals(
      isForeignKeyConstraintError({ "cause": { "code": "23502" } }),
      false,
    );
  });
});

describe("getForeignKeyConstraintErrorData", () => {
  it("returns the data if the error is a foreign key constraint error", () => {
    const error = {
      cause: {
        code: "23503",
        detail:
          'Key (reader_id)=(0195bda3-0273-700d-8a4c-a2548e5a5888) is not present in table "reader".',
      },
    };

    assertEquals(
      getForeignKeyConstraintErrorData(error),
      { reader_id: "0195bda3-0273-700d-8a4c-a2548e5a5888" },
    );
  });

  it("returns null if the error is not a foreign key constraint error", () => {
    assertEquals(getForeignKeyConstraintErrorData(new Error("test")), null);
  });
});

describe("isInvalidSyntaxError", () => {
  it("returns true if the error is an invalid syntax error", () => {
    assertEquals(
      isInvalidSyntaxError({
        message: 'invalid input syntax for type integer: "test"',
      }),
      true,
    );
  });

  it("returns false if the error has a different message", () => {
    assertEquals(
      isInvalidSyntaxError({ message: "some error message" }),
      false,
    );
  });
});

describe("getInvalidSyntaxErrorData", () => {
  it("returns the data if the error is an invalid syntax error", () => {
    assertEquals(
      getInvalidSyntaxErrorData({
        message: 'invalid input syntax for type integer: "test"',
      }),
      '"test"',
    );
  });

  it("returns null if the error is not an invalid syntax error", () => {
    assertEquals(getInvalidSyntaxErrorData(new Error("test")), null);
  });
});
