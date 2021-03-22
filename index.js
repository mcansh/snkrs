const { createRequestHandler } = require('@remix-run/vercel');
const { PrismaClient } = require('@prisma/client');
const remixConfig = require('./remix.config');

const prisma = new PrismaClient();

module.exports = createRequestHandler({
  build: require(remixConfig.serverBuildDirectory),
  getLoadContext() {
    return { prisma };
  },
});
