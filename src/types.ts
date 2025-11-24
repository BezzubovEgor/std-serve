export type CanBePromise<T> = T | Promise<T>;

/**
 * The response that is sent back to the client.
 */
export type Response = string | undefined;

/**
 * The handler function that is called at the end of the middleware chain.
 * It receives a request of type `Req` and returns a `Response`.
 */
export type Handler<Req = any, Res = Response> = (req: Req) => CanBePromise<Res>;

/**
 * The `next` function that passes control to the next middleware in the chain.
 * It can be called with a new request object, which will be passed to the next middleware.
 */
export type Next<Req = any, Res = Response> = (req: Req) => CanBePromise<Res>;

/**
 * A middleware function.
 * It receives a request `Req` and a `next` function.
 * It can return a `Response` to end the chain, or call `next` to continue.
 * When calling `next`, it can pass a new request object of type `ReqNext`.
 */
export type Middleware<Req, Res, ReqNext = Req, ResNext = Res> = (
  req: Req,
  next: Next<ReqNext, ResNext>,
) => CanBePromise<Res | ResNext>;
