/* eslint-disable no-console */
import express from 'express';
import { createRequestHandler } from '@remix-run/express';
// this is a virtual module so it's fine
// eslint-disable-next-line import/no-extraneous-dependencies
import * as serverBuild from '@remix-run/dev/server-build';
import * as Sentry from '@sentry/node';

let MODE = process.env.NODE_ENV;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: MODE === 'production' && process.env.FLY === '1',
  environment: MODE,
  release: process.env.COMMIT_SHA,
  tracesSampleRate: 0.3,
});

Sentry.setContext('region', { name: process.env.FLY_REGION ?? 'unknown' });

let app = express();

app.use((req, res, next) => {
  res.set('x-fly-region', process.env.FLY_REGION ?? 'unknown');
  res.set('Strict-Transport-Security', `max-age=${60 * 60 * 24 * 365 * 100}`);

  let proto = req.get('X-Forwarded-Proto');
  let host = req.get('X-Forwarded-Host') ?? req.get('host');

  // HTTPS-upgrade
  if (proto === 'http') {
    res.set('X-Forwarded-Proto', 'https');
    res.redirect(`https://${host}${req.originalUrl}`);
    return;
  }

  next();
});

// if we're not in the primary region, then we need to make sure all
// non-GET/HEAD/OPTIONS requests hit the primary region rather than read-only
// Postgres DBs.
// learn more: https://fly.io/docs/getting-started/multi-region-databases/#replay-the-request
app.all('*', function getReplayResponse(req, res, next) {
  let method = req.method.toLowerCase();
  let isMethodReplayable = !['get', 'options', 'head'].includes(method);
  let isReadOnlyRegion =
    process.env.FLY_REGION &&
    process.env.FLY_PRIMARY_REGION &&
    process.env.FLY_REGION !== process.env.FLY_PRIMARY_REGION;

  let shouldReplay = isMethodReplayable && isReadOnlyRegion;

  if (!shouldReplay) return next();

  let logInfo = {
    pathname: req.path,
    method,
    FLY_PRIMARY_REGION: process.env.FLY_PRIMARY_REGION,
    FLY_REGION: process.env.FLY_REGION,
  };
  console.info(`Replaying:`, logInfo);
  res.set('fly-replay', `region=${process.env.FLY_PRIMARY_REGION}`);
  return res
    .status(409)
    .send(`Replaying request to ${process.env.FLY_PRIMARY_REGION}`);
});

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

// Remix fingerprints its assets so we can cache forever.
app.use(
  '/build',
  express.static('public/build', { immutable: true, maxAge: '1y' })
);

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('public', { maxAge: '1h' }));

app.all('*', createRequestHandler({ build: serverBuild }));

let port = process.env.PORT ?? 3000;

app.listen(port, () => {
  console.log(`✅ app ready: http://localhost:${port}`);
});
