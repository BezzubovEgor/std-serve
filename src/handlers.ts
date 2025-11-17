export type CanBePromise<T> = T | Promise<T>;

export type Cond<Returns = unknown> = (msg: string) => CanBePromise<[
  () => CanBePromise<boolean>,
  () => CanBePromise<Returns>,
]>;

export function on(
  ...conds: Cond<string | undefined>[]
) {
  return async (msg: string) => {
    try {
      for (const cond of conds) {
        try {
          const [matches, then] = await cond(msg);
          if (await matches()) return await then();
        } catch {
          // Skip condition if it fails
        }
      }
      return JSON.stringify({ type: "error", payload: "not handled!" });
    } catch {
      return undefined;
    }
  };
}
