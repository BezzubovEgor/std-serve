import { assertEquals } from "@std/assert";
import { Readable, Writable } from "node:stream";
import type { Buffer } from "node:buffer";
import { stdServe } from "../bus.ts";

const deferred = <T>() => {
  let resolve: undefined | ((value: T | PromiseLike<T>) => void);
  let reject: undefined | ((reason?: Error) => void);

  const promise = new Promise<T>((resolve_, reject_) => {
    resolve = resolve_;
    reject = reject_;
  });

  if (!resolve || !reject) {
    throw new Error("Promise not initialized");
  }

  return {
    promise,
    resolve,
    reject,
  };
};

class TestReadableStream extends Readable {
  #data: string[] = [];

  constructor(lines: string[]) {
    super();
    this.#data = lines;
  }

  override _read(size: number): void {
    const lines = this.#data.map((line) => `${line}\n`).join("");
    this.push(lines.slice(0, size));
    this.#data = lines.slice(size).split("\n").map((line) => line.trim())
      .filter(Boolean);
  }
}

class TestWritableStream extends Writable {
  #chunks: ReturnType<typeof deferred<string>>[] = [deferred<string>()];

  override _write(
    chunk: Buffer,
    encoding: string,
    callback: (error?: Error | null) => void,
  ): void {
    const data = chunk.toString();
    this.#chunks.at(-1)?.resolve(data);
    this.#chunks.push(deferred<string>());
    callback();
  }

  async *chunks() {
    let index = 0;
    while (this.#chunks.length) {
      const chunk = await this.#chunks.at(index++)?.promise;
      yield chunk;
    }
  }
}

Deno.test("stdServe should process a single line and write the response", async () => {
  const readable = new TestReadableStream(["hello", "world"]);
  const writable = new TestWritableStream();

  const handler = (msg: string) => {
    return `response for ${msg}`;
  };

  const server = stdServe(handler, {
    input: readable,
    output: writable,
  });

  const chunks = writable.chunks();

  const data1 = (await chunks.next()).value;
  assertEquals(data1, "response for hello\n");

  const data2 = (await chunks.next()).value;
  assertEquals(data2, "response for world\n");

  server.close();
});
