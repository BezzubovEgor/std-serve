import * as readline from "node:readline";
import * as process from "node:process";

import type { Handler } from "./types.ts";

export function stdServe(
  handler: Handler,
): void {
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  rl.on("line", async (text: string) => {
    if (!text) return;

    try {
      const response = await handler(text);
      if (response === undefined) return;
      process.stdout.write(response + "\n");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      process.stdout.write(
        JSON.stringify({ type: "error", payload: error.message }) + "\n",
      );
    }
  });
}
