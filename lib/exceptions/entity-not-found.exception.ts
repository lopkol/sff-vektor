import { BaseException } from "@/exceptions/base.exception.ts";

export class EntityNotFoundException extends BaseException {
  constructor(message: string, context?: unknown) {
    super(message, "ENTITY_NOT_FOUND", context);
  }
}
