import type { Handler, Middleware, Response } from "./types.ts";

/**
 * Composes multiple middlewares into a single handler.
 * Middlewares are executed in the order they are provided.
 *
 * @param middlewares The middlewares to compose.
 * @returns A function that takes a handler and returns a new handler that executes the middlewares.
 */
export function compose<Req, Res extends Response>(
  ...middlewares: Middleware<any, Res, any, Res>[]
): (handler: Handler<any, Res>) => Handler<Req, Res> {
  return (handler) => {
    return (req) => {
      let index = -1;

      const dispatch = (i: number, currentReq: any): Promise<Res> => {
        if (i <= index) {
          return Promise.reject(new Error("next() called multiple times"));
        }
        index = i;

        if (i === middlewares.length) {
          return Promise.resolve(handler(currentReq));
        }

        const middleware = middlewares[i];
        const next = (nextReq?: any) => dispatch(i + 1, nextReq ?? currentReq);

        try {
          return Promise.resolve(middleware(currentReq, next));
        } catch (err) {
          return Promise.reject(err);
        }
      };

      return dispatch(0, req);
    };
  };
}
