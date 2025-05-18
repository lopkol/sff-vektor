import { BaseException } from "@/exceptions/base.exception.ts";
import type { ZodError } from "zod";

export class ValidationException extends BaseException {
  constructor(error?: ZodError) {
    super("Validation error", "VALIDATION_ERROR", {
      issues: error?.issues,
    });
  }
}
