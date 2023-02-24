import path from "node:path";
import fastify from "fastify";
import { remixFastifyPlugin } from "@mcansh/remix-fastify";
import * as Sentry from "@sentry/node";

let MODE = process.env.NODE_ENV;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: MODE === "production" && !!process.env.RAILWAY_GIT_COMMIT_SHA,
  environment: process.env.RAILWAY_ENVIRONMENT || MODE,
  release: process.env.RAILWAY_GIT_COMMIT_SHA,
  tracesSampleRate: 0.3,
});

let app = fastify();

await app.register(remixFastifyPlugin, {
  build: path.join(process.cwd(), "build", "index.js"),
  mode: MODE,
  purgeRequireCacheInDevelopment: false,
});

let port = Number(process.env.PORT) || 3000;

let address = await app.listen({ port, host: "0.0.0.0" });
console.log(`✅ app ready: ${address}`);
