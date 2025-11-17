import type { z } from "zod";

import type { CanBePromise, Cond } from "./handlers.ts";

export function json(
  ...conds: Cond[]
): Cond<string | undefined> {
  return async (msg: string) => {
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
                return JSON.stringify(await then());
              }
            }
            return JSON.stringify({ type: "error", payload: "not handled!" });
          } catch {
            return undefined;
          }
        },
      ];
    } catch {
      return [async () => false, async () => undefined];
    }
  };
}

export function is<S = unknown>(
  checker: (msg: S) => CanBePromise<boolean>,
  then: (msg: S) => CanBePromise<unknown>,
): Cond {
  return async (msg: unknown) => [
    async () => await checker(msg as S),
    async () => await then(msg as S),
  ];
}

export function match<S extends z.ZodSchema>(
  schema: S,
  then: (msg: z.infer<S>) => CanBePromise<unknown>,
): Cond {
  return is(
    async (msg) => (await schema.safeParseAsync(msg)).success,
    async (msg) => await then(schema.parse(msg)),
  );
}
