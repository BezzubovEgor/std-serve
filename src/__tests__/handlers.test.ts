import { assertEquals } from "@std/assert";

import { on } from "../handlers.ts";
import { json, match } from "../json.ts";
import { z } from "zod";

Deno.test("on should execute the first matching condition", async () => {
  const handler = on(
    (msg: string) => [
      () => msg === "hello",
      () => "world",
    ],
    (msg: string) => [
      () => msg === "foo",
      () => "bar",
    ],
  );

  const response = await handler("hello");
  assertEquals(response, "world");
});

Deno.test("on should return not handled when no condition matches", async () => {
  const handler = on(
    (msg: string) => [
      () => msg === "hello",
      () => "world",
    ],
  );

  const response = await handler("goodbye");
  assertEquals(
    response,
    JSON.stringify({ type: "error", payload: "not handled!" }),
  );
});

Deno.test("on should skip condition if it throws an error", async () => {
  const handler = on(
    (_msg: string) => {
      throw new Error("condition error");
    },
    (msg: string) => [
      () => msg === "foo",
      () => "bar",
    ],
  );

  const response = await handler("foo");
  assertEquals(response, "bar");
});

