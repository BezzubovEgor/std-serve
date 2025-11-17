import { z } from "zod";

import { stdServe } from "../index.ts";
import { on } from "../handlers.ts";
import { json, match } from "../json.ts";

const EchoSchema = z.object({
  type: z.literal("echo"),
  payload: z.any().optional(),
});

const HelloSchema = z.object({
  type: z.literal("hello"),
  payload: z.object({ name: z.string() }),
});

await stdServe(
  on(
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
// {"type":"message:req", "payload": {"type":"echo", "payload": "xxx"}}
// {"type":"message:req", "payload": {"type":"hello", "payload": {"name": "World"}}}
