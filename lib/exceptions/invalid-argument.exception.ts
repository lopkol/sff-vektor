import { BaseException } from "@/exceptions/base.exception.ts";

export class InvalidArgumentException extends BaseException {
  constructor(message: string, context?: unknown) {
    super(message, "INVALID_ARGUMENT", context);
  }
}
