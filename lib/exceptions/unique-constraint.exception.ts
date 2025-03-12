import { BaseException } from "@/exceptions/base.exception.ts";

export class UniqueConstraintException extends BaseException {
  constructor(message: string, context?: unknown) {
    super(message, "UNIQUE_CONSTRAINT_VIOLATION", context);
  }
}
