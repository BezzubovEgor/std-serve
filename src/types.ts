export type CanBePromise<T> = T | Promise<T>;
export type Handler = (msg: string) => CanBePromise<string | undefined>;
