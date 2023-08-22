import fs from "node:fs";
import path from "node:path";
import fastify from "fastify";
import { remixFastifyPlugin } from "@mcansh/remix-fastify";
import * as Sentry from "@sentry/node";
import { installGlobals } from "@remix-run/node";

installGlobals();

let MODE = process.env.NODE_ENV || "production";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: MODE === "production" && !!process.env.RAILWAY_GIT_COMMIT_SHA,
  environment: process.env.RAILWAY_ENVIRONMENT || MODE,
  release: process.env.RAILWAY_GIT_COMMIT_SHA,
  tracesSampleRate: 0.3,
});

let app = fastify();

let buildPath = path.join(process.cwd(), "build", "index.js");
let stat = fs.statSync(buildPath);
/** @type { import('@remix-run/node').ServerBuild | Promise<import('@remix-run/node').ServerBuild> } */
let build = await import(buildPath + "?t=" + stat.mtimeMs);

await app.register(remixFastifyPlugin, {
  build,
  mode: MODE,
  purgeRequireCacheInDevelopment: false,
});

let port = Number(process.env.PORT) || 3000;

let address = await app.listen({ port, host: "0.0.0.0" });
console.log(`✅ app ready: ${address}`);

if (MODE === "development") {
  let { broadcastDevReady } = await import("@remix-run/node");
  broadcastDevReady(build);
}
