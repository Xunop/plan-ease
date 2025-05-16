import esbuild from "esbuild";

import dotenv, { type DotenvParseOutput } from "dotenv";

const result = dotenv.config({ path: ".env" });

function prepareDefine(config: DotenvParseOutput | undefined) {
  const define = {};
  // @ts-ignore
  for (const [key, value] of Object.entries(config)) {
    // @ts-ignore
    define[`process.env.${key}`] = JSON.stringify(value);
  }
  return define;
}

const define = prepareDefine(result.parsed);
try {
  esbuild
    .build({
      entryPoints: {
        server: "hocuspocus.ts",
      },
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node22",
      outExtension: { ".js": ".mjs" },
      minify: true,
      sourcemap: true,
      outdir: "dist",
      tsconfig: "tsconfig.json",
      define,
      packages: "external",
    })
    .catch(() => {
      return process.exit(1);
    });
} catch (error) {
  console.log(error);
}
