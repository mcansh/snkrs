const path = require('path');

const express = require('express');
const { createRequestHandler } = require('@remix-run/express');

const app = express();

app.use(express.static('public', { immutable: true, maxAge: '1y' }));

function devHandler(req, res, next) {
  const cwd = process.cwd();
  for (const key in require.cache) {
    if (key.startsWith(path.join(cwd, 'build'))) {
      delete require.cache[key];
      // eslint-disable-next-line no-console
      console.log('deleted', key);
    }
  }

  return createRequestHandler({
    build: require('./build'),
  })(req, res, next);
}

function productionHandler(req, res, next) {
  createRequestHandler({
    build: require('./build'),
  })(req, res, next);
}

app.all(
  '*',
  process.env.NODE_ENV === 'production' ? productionHandler : devHandler
);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Remix App Server started on port ${port}`);
});
