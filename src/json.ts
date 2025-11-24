import type { z } from "zod";

import type { CanBePromise, Response } from "./types.ts";
import type { Cond } from "./handlers.ts";

export function json(
  ...conds: Cond<any, any>[]
): Cond<string, string | undefined> {
  return (msg) => {
    try {
      const parsed = JSON.parse(msg);
      return [
        async () => {
          try {
            for (const cond of conds) {
              const [matches] = await cond(parsed);
              if (await matches()) return true;
            }
          } catch {
            return false;
          }
          return false;
        },

        async () => {
          try {
            for (const cond of conds) {
              const [matches, then] = await cond(parsed);
              if (await matches()) {
                const result = await then();
                if (result === undefined) return undefined;
                return JSON.stringify(result);
              }
            }
            return JSON.stringify({
              type: "error",
              payload: "not handled!",
            });
          } catch {
            return undefined;
          }
        },
      ];
    } catch {
      return [() => false, () => undefined];
    }
  };
}

export function is<Req>(
  checker: (msg: Req) => CanBePromise<boolean>,
  then: (msg: Req) => CanBePromise<any>,
): Cond<Req, any> {
  return (req) => [
    () => checker(req),
    () => then(req),
  ];
}

export function match<S extends z.ZodSchema>(
  schema: S,
  then: (msg: z.infer<S>) => CanBePromise<any>,
): Cond<z.infer<S>, any> {
  return is(
    (req) => schema.safeParseAsync(req).then((r) => r.success),
    (req) => then(schema.parse(req)),
  );
}
