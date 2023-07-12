import path from "node:path";

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
export default {
  cacheDirectory: path.join(process.cwd(), "node_modules", ".cache", "remix"),
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  serverBuildPath: "build/index.js",
  publicPath: "/build/",
  serverDependenciesToBundle: ["ts-extras"],
  postcss: true,
  tailwind: true,
  serverModuleFormat: "cjs",
  future: {
    v2_dev: {
      command: "node --require dotenv-flow/config ./server.mjs",
      restart: false,
    },
    v2_errorBoundary: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
};
