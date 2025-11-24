import type { CanBePromise, Handler, Response } from "./types.ts";

export type Cond<Req = any, Res = Response> = (req: Req) => CanBePromise<[
  () => CanBePromise<boolean>,
  () => CanBePromise<Res>,
]>;

export function on<Req, Res extends Response>(
  ...conds: Cond<Req, Res>[]
): Handler<Req, Res> {
  return async (req) => {
    try {
      for (const cond of conds) {
        try {
          const [matches, then] = await cond(req);
          if (await matches()) return await then();
        } catch {
          // Skip condition if it fails
        }
      }
      return JSON.stringify({ type: "error", payload: "not handled!" }) as Res;
    } catch {
      return undefined as Res;
    }
  };
}
