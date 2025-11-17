import { build, emptyDir } from "@deno/dnt";
import denoJson from "../deno.json" with { type: "json" };

await emptyDir("./npm");

await build({
  entryPoints: [
    { name: ".", path: "./src/index.ts" },
    { name: "./json", path: "./src/json.ts" },
  ],
  outDir: "./npm",
  shims: {
    deno: true,
    blob: true,
  },
  test: true,
  typeCheck: false,
  package: {
    name: denoJson.name,
    version: denoJson.version,
    description: denoJson.description,
    license: denoJson.license,
    private: false,
    repository: {
      type: "git",
      url: "git+https://github.com/BezzubovEgor/postmessage-transfer.git",
    },
    bugs: {
      url: "https://github.com/BezzubovEgor/postmessage-transfer/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
