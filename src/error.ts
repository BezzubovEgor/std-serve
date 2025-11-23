export class StdServeError extends Error {
  override name: string = "StdServeError";
  code?: string;
  details?: unknown;

  constructor(message: string, options?: { code?: string; details?: unknown }) {
    super(message);
    this.code = options?.code;
    this.details = options?.details;
  }
}
