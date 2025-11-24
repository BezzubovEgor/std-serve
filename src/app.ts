import type { Handler, Middleware, Response } from "./types.ts";
import { on as onHandler, type Cond } from "./handlers.ts";
import { compose } from "./middleware.ts";

/**
 * The main application class.
 * It allows you to register global middlewares and handlers.
 */
export class App<Req, Res extends Response> {
  private middlewares: Middleware<any, Res, any, Res>[] = [];

  /**
   * Adds a global middleware to the application.
   *
   * @param middleware The middleware to add.
   */
  public use<ReqNext, ResNext extends Res>(
    middleware: Middleware<Req, Res, ReqNext, ResNext>,
  ): App<ReqNext, ResNext> {
    this.middlewares.push(middleware);
    return this as unknown as App<ReqNext, ResNext>;
  }

  /**
   * Defines a handler with a set of conditions.
   * It can also be configured with its own middlewares.
   *
   * @param middlewares And array of middlewares to apply to this handler.
   * @param conds The conditions to apply to this handler.
   * @returns A handler function.
   */
  public on(
    ...args:
      | Cond<any, Res>[]
      | [...Middleware<any, Res, any, Res>[], ...Cond<any, Res>[]]
  ): Handler<Req, Res> {
    const middlewares = args.filter((arg) => arg.length === 2) as Middleware<
      any,
      Res,
      any,
      Res
    >[];
    const conds = args.filter((arg) => arg.length !== 2) as Cond<any, Res>[];

    const handler = onHandler(...conds);

    return compose(...this.middlewares, ...middlewares)(handler);
  }
}
