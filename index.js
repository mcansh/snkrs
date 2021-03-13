const { createRequestHandler } = require('@remix-run/vercel');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = createRequestHandler({
  build: require('./build'),
  getLoadContext() {
    return { prisma };
  },
});
