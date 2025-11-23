import * as readline from "node:readline";
import * as process from "node:process";

import type { Handler } from "./types.ts";
import { StdServeError } from "./error.ts";

export function stdServe(
  handler: Handler,
  options?: {
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
  },
): { close: () => void } {
  const { input = process.stdin, output = process.stdout } = options ?? {};
  const rl = readline.createInterface({
    input,
    crlfDelay: Infinity,
  });

  const handleLine = async (text: string) => {
    if (!text) return;

    const response = await handler(text);
    if (response === undefined) return;
    output.write(response + "\n");
  };

  rl.on("line", (text) => {
    handleLine(text).catch((err) => {
      const error = err instanceof Error
        ? err
        : new StdServeError("Unknown error", { details: err });
      output.write(
        JSON.stringify({ type: "error", payload: error.message }) + "\n",
      );
    });
  });

  return {
    close: () => rl.close(),
  };
}
