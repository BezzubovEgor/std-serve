import { assertEquals } from "@std/assert";
import { Readable, Writable } from "node:stream";
import type { Buffer } from "node:buffer";
import { stdServe } from "../bus.ts";

class TestReadableStream extends Readable {
  #data: string[] = [];
  #processed: boolean = false;

  constructor(lines: string[]) {
    super();
    this.#data = lines;
  }

  override _read(_size: number): void {
    if (this.#data.length > 0) {
      this.push(this.#data.shift() + "\n");
    } else if (!this.#processed) {
      this.push(null); // Signal end of stream only once
      this.#processed = true;
    }
  }
}

class TestWritableStream extends Writable {
  #writtenData: string = "";

  override _write(
    chunk: Buffer,
    _encoding: string,
    callback: (error?: Error | null) => void,
  ): void {
    this.#writtenData += chunk.toString();
    callback();
  }

  getWrittenData(): string {
    return this.#writtenData;
  }
}

Deno.test("stdServe should process a single line and write the response", async () => {
  const readable = new TestReadableStream(["hello"]);
  const writable = new TestWritableStream();

  const handler = (msg: string) => {
    return `response for ${msg}`;
  };

  const server = stdServe(handler, {
    input: readable,
    output: writable,
  });

  // Allow some time for the stream to be processed
  await new Promise((resolve) => setTimeout(resolve, 50));

  assertEquals(writable.getWrittenData(), "response for hello\n");
  server.close();
});

Deno.test("stdServe should process multiple lines and write responses", async () => {
  const readable = new TestReadableStream(["hello", "world"]);
  const writable = new TestWritableStream();

  const handler = (msg: string) => {
    return `response for ${msg}`;
  };

  const server = stdServe(handler, {
    input: readable,
    output: writable,
  });

  // Allow some time for the stream to be processed
  await new Promise((resolve) => setTimeout(resolve, 50));

  assertEquals(writable.getWrittenData(), "response for hello\nresponse for world\n");
  server.close();
});

Deno.test("stdServe should handle handler returning undefined", async () => {
  const readable = new TestReadableStream(["no-response"]);
  const writable = new TestWritableStream();

  const handler = (msg: string) => {
    if (msg === "no-response") {
      return undefined;
    }
    return `response for ${msg}`;
  };

  const server = stdServe(handler, {
    input: readable,
    output: writable,
  });

  // Allow some time for the stream to be processed
  await new Promise((resolve) => setTimeout(resolve, 50));

  assertEquals(writable.getWrittenData(), "");
  server.close();
});

Deno.test("stdServe should handle handler throwing an error", async () => {
  const readable = new TestReadableStream(["error"]);
  const writable = new TestWritableStream();

  const handler = (msg: string) => {
    if (msg === "error") {
      throw new Error("Handler failed");
    }
    return `response for ${msg}`;
  };

  const server = stdServe(handler, {
    input: readable,
    output: writable,
  });

  // Allow some time for the stream to be processed
  await new Promise((resolve) => setTimeout(resolve, 50));

  assertEquals(writable.getWrittenData(), '{"type":"error","payload":"Handler failed"}\n');
  server.close();
});