export interface IBaseError {
  message: string;
  code: string;
  details?: unknown;
}

export abstract class BaseException extends Error implements IBaseError {
  protected constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}
