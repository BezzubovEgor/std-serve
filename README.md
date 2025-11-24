```
███████╗████████╗██████╗       ███████╗███████╗██████╗ ██╗   ██╗███████╗
██╔════╝╚══██╔══╝██╔══██╗      ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝
███████╗   ██║   ██║  ██║█████╗███████╗█████╗  ██████╔╝██║   ██║█████╗  
╚════██║   ██║   ██║  ██║╚════╝╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  
███████║   ██║   ██████╔╝      ███████║███████╗██║  ██║ ╚████╔╝ ███████╗
╚══════╝   ╚═╝   ╚═════╝       ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝
```
# @ybezz/std-serve

`@ybezz/std-serve` is a powerful and lightweight library for building modern, interactive stdio servers. It leverages a request-response model over standard I/O, making it easy to create composable and maintainable tools that can interact with other processes. Whether you're working in a Deno or Node.js environment, this library provides a seamless experience for developing sophisticated stdio applications.

| [![codecov](https://codecov.io/github/BezzubovEgor/std-serve/graph/badge.svg?token=5M5x9FFgTm)](https://codecov.io/github/BezzubovEgor/std-serve) | [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) | [![jsr-version](https://jsr.io/badges/@ybezz/std-serve)](https://jsr.io/@ybezz/std-serve) | [![npm-version](https://img.shields.io/npm/v/@ybezz/std-serve)](https://www.npmjs.com/package/@ybezz/std-serve) |
|---|---|---|---|

## Overview

`@ybezz/std-serve` simplifies the creation of stdio servers that communicate over a request-response pattern. It allows you to define handlers that process line-delimited messages from `stdin` and send back responses to `stdout`. This approach is ideal for building composable tools that can be easily integrated with other processes or scripts, whether you are in a Deno or Node.js environment.

## Features

*   **Cross-Runtime Compatibility:** Seamlessly use in both Deno and Node.js projects.
*   **Request-Response Model:** Simple and clear communication over standard I/O.
*   **Composable Handlers:** Build complex logic from smaller, reusable handler functions.
*   **Flexible Routing:** Use `on` to define routes based on message content or conditions.
*   **JSON Support:** Helpers for working with JSON-based protocols.
*   **Schema Validation:** Integrate with `Zod` for robust, type-safe message validation.


## Getting Started

### Installation

`@ybezz/std-serve` is designed for both Deno and Node.js environments.

#### Deno

To add the library to your `deno.json`, run:

```bash
deno add @ybezz/std-serve
```

You can then import it in your project:

```typescript
import { stdServe, on, json, is } from "jsr:@ybezz/std-serve";
// You can also import specific modules for a more modular approach:
// import { json } from "jsr:@ybezz/std-serve/json";
// import { on } from "jsr:@ybezz/std-serve/handlers";
```

#### Node.js

For Node.js projects, you can use either JSR or NPM.

**Using JSR:**

```bash
npx jsr add @ybezz/std-serve
```

**Using NPM:**

```bash
npm install @ybezz/std-serve
```

Once installed, you can import it like any other Node.js module:

```typescript
import { stdServe, on, json, is } from "@ybezz/std-serve";
// For a modular approach, you can also import specific modules:
// import { json } from "@ybezz/std-serve/json";
// import { on } from "@ybezz/std-serve/handlers";
```

### Quick Start

Here's a quick example of an "echo" server and a "sum" calculator using Zod for schema validation. This demonstrates how to set up a simple CLI application that responds to structured input.

```typescript
import { z } from "zod";
import { stdServe, on, json, match } from "jsr:@ybezz/std-serve";
// For Node.js, install via npm and use:
// import { z } from "zod";
// import { stdServe, on, json, match } from "@ybezz/std-serve";

// Define Zod schemas for incoming messages
const EchoSchema = z.object({
  type: z.literal("echo"),
  payload: z.any().optional(),
});

const SumSchema = z.object({
  type: z.literal("sum"),
  payload: z.object({
    a: z.number(),
    b: z.number(),
  }),
});

const echoHandler = match(EchoSchema, (req) => {
    console.log("Received echo request:", req.payload);
    return { response: req.payload, status: "success" };
  });


const sumHandler = match(SumSchema, (req) => {
    const { a, b } = req.payload;
    return { result: a + b, status: "success" };
  });

// Combine handlers and start the server
stdServe(
  on(
    json(
      echoHandler,
      sumHandler,
    ),
  ),
  // You can also add non-JSON or other types of handlers
  // on(
  //   (msg: string) => msg.toLowerCase() === "ping",
  //   () => "pong"
  // ),
);
```

To run this example, save it as `your_script_name.ts` (e.g., `my_server.ts`) and execute:

```bash
deno run -A your_script_name.ts
```

Then, in the terminal, you can send messages to its standard input, simply type your message and press Enter:

```bash
{"type": "echo", "payload": "Hello, std-serve!"}            // Line with echo message
{"response": "Hello, std-serve!", "status": "success"}      // Response to echo message

{"type": "sum", "payload": {"a": 5, "b": 3}}                // Line with sum message
{"result": 8, "status": "success"}                          // Response to sum message      
```

Also you can check it like this:

```bash
# Echo example
echo '{"type": "echo", "payload": "Hello, std-serve!"}' | deno run -A your_script_name.ts
{"response": "Hello, std-serve!", "status": "success"} 

# Sum example
echo '{"type": "sum", "payload": {"a": 5, "b": 3}}' | deno run -A your_script_name.ts
{"result": 8, "status": "success"}
    
# Ping example (if you uncomment the ping handler in the code above)
# echo 'ping' | deno run -A your_script_name.ts
```

## API Reference

*   **`stdServe(...handlers)`**: Wires up handlers to `Deno.stdin` and `Deno.stdout`.
*   **`on(...[condition, handler])`**: Creates a composable handler that executes if the condition is met.
*   **`json(...[condition, handler])`**: A helper for working with JSON payloads, automatically parsing and stringifying.
*   **`is((msg) => boolean | Promise<boolean>, (msg) => Response | Promise<Response>)`**: A condition helper executes handler if the condition is met.
*   **`match(schema, (parsedMsg) => Response | Promise<Response>)`**: Similar to `is`, but executes handler if the message matches the schema.

## Development

The project uses Deno for development and `dnt` for NPM builds.

*   `deno task dev`: Runs the example terminal for development with file watching.
*   `deno task build:npm`: Builds the project for publishing to npm.
*   `deno task publish:npm`: Performs a dry run build and publish to npm.

## License

This project is licensed under the MIT License.
