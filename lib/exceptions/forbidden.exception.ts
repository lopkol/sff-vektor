import { BaseException } from "@/exceptions/base.exception.ts";

export class ForbiddenException extends BaseException {
  constructor(message: string, code: string, details?: unknown) {
    super(message, code, details);
  }
}
