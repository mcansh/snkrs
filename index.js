const express = require('express');
const { createRequestHandler } = require('@remix-run/express');

const app = express();
app.use(express.static('public', { immutable: true, maxAge: '1y' }));

app.all(
  '*',
  process.env.NODE_ENV === 'production'
    ? createRequestHandler({
        build: require('./build'),
      })
    : (req, res, next) =>
        // require cache is purged in @remix-run/dev where the file watcher is
        createRequestHandler({
          build: require('./build'),
        })(req, res, next)
);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Remix App Server started on port ${port}`);
});
