const path = require('path');

const express = require('express');
const { createRequestHandler } = require('@remix-run/express');
const { PrismaClient } = require('@prisma/client');

const remixConfig = require('./remix.config');

const prisma = new PrismaClient();

const app = express();

app.use(express.static('public', { immutable: true, maxAge: '1y' }));

if (process.env.NODE_ENV !== 'production') {
  const cwd = process.cwd();
  app.all('*', (req, res) => {
    for (const key in require.cache) {
      if (key.startsWith(path.join(cwd, 'build'))) {
        delete require.cache[key];
        // eslint-disable-next-line no-console
        console.log('deleted', key);
      }
    }
    return createRequestHandler({
      build: require(remixConfig.serverBuildDirectory),
      getLoadContext() {
        return { prisma };
      },
    })(req, res);
  });
} else {
  app.all(
    '*',
    createRequestHandler({
      build: require(remixConfig.serverBuildDirectory),
      getLoadContext() {
        return { prisma };
      },
    })
  );
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Express server started on http://localhost:${port}`);
});
