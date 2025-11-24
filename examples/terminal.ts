import { z } from "zod";
import { stdServe, App } from "../src/index.ts";
import { json, match } from "../src/json.ts";
import { on } from "../src/handlers.ts";

const EchoSchema = z.object({
  type: z.literal("echo"),
  payload: z.any().optional(),
});

const HelloSchema = z.object({
  type: z.literal("hello"),
  payload: z.object({ name: z.string() }),
});

const app = new App();

// Global middleware to log requests
app.use(async (req, next) => {
  console.log(`Received request: ${req}`);
  return await next();
});

stdServe(
  app.on(
    // Handler-specific middleware to measure execution time
    async (req, next) => {
      const start = Date.now();
      const res = await next();
      const duration = Date.now() - start;
      console.log(`Request took ${duration}ms`);
      return res;
    },
    json(
      match(EchoSchema, () => ({ type: "echo", payload: "echo" })),
      match(
        HelloSchema,
        (msg) => ({
          type: "HH",
          payload: { message: `Hello ${msg.payload.name}!` },
        }),
      ),
    ),
    (
      msg: string,
    ) => [
      () => msg.toLowerCase() === "hello",
      () => "Hi, dude!",
    ],
  ),
);

// {"type":"echo", "payload": "xxx"}
// {"type":"hello", "payload": {"name": "World"}}
