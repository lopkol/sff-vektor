export type ApiError = {
  code: string;
  message: string;
  details: Record<string, unknown>;
};
