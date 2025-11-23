import { assertEquals } from "@std/assert";
import { on } from "../handlers.ts";
import { json, is, match } from "../json.ts";
import { z } from "zod";

interface ParsedJsonMessage {
  type: string;
  [key: string]: unknown; // Use unknown for properties we don't care about
}

Deno.test("json should correctly parse a valid JSON string and pass it to conditions", async () => {
  const handler = on(
    json(
      (msg: unknown) => {
        const parsedMsg = msg as ParsedJsonMessage;
        return [
          () => parsedMsg.type === "hello",
          () => "world",
        ];
      },
    ),
  );

  const response = await handler(JSON.stringify({ type: "hello" }));
  assertEquals(response, '"world"');
});

Deno.test("json should return not handled when no condition matches", async () => {
  const handler = on(
    json(
      (msg: unknown) => {
        const parsedMsg = msg as ParsedJsonMessage;
        return [
          () => parsedMsg.type === "hello",
          () => "world",
        ];
      },
    ),
  );

  const response = await handler(JSON.stringify({ type: "goodbye" }));
  assertEquals(response, '{"type":"error","payload":"not handled!"}');
});

Deno.test("json should return not handled for invalid json", async () => {
  const handler = on(
    json(
      (msg: unknown) => {
        const parsedMsg = msg as ParsedJsonMessage;
        return [
          () => parsedMsg.type === "hello",
          () => "world",
        ];
      },
    ),
  );

  const response = await handler("invalid json");
  assertEquals(response, '{"type":"error","payload":"not handled!"}');
});

Deno.test("is should execute then function when checker returns true", async () => {
  const handler = on(
    json(
      is(
        (msg: unknown) => (msg as ParsedJsonMessage).type === "hello",
        () => "world",
      ),
    ),
  );

  const response = await handler(JSON.stringify({ type: "hello" }));
  assertEquals(response, '"world"');
});

Deno.test("is should not execute then function when checker returns false", async () => {
  const handler = on(
    json(
      is(
        (msg: unknown) => (msg as ParsedJsonMessage).type === "hello",
        () => "world",
      ),
      is(
        (msg: unknown) => (msg as ParsedJsonMessage).type === "goodbye",
        () => "moon",
      ),
    ),
  );

  const response = await handler(JSON.stringify({ type: "goodbye" }));
  assertEquals(response, '"moon"');
});

Deno.test("match should successfully validate a correct schema", async () => {
  const HelloSchema = z.object({
    type: z.literal("hello"),
    payload: z.string(),
  });

  const handler = on(
    json(
      match(HelloSchema, (msg) => `Hello, ${msg.payload}`),
    ),
  );

  const response = await handler(JSON.stringify({ type: "hello", payload: "world" }));
  assertEquals(response, '"Hello, world"');
});

Deno.test("match should fail to validate an incorrect schema", async () => {
  const HelloSchema = z.object({
    type: z.literal("hello"),
    payload: z.string(),
  });

  const handler = on(
    json(
      match(HelloSchema, (msg) => `Hello, ${msg.payload}`),
    ),
  );

  const response = await handler(JSON.stringify({ type: "goodbye", payload: "world" }));
  assertEquals(response, '{"type":"error","payload":"not handled!"}');
});
