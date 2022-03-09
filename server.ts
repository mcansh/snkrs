/* eslint-disable no-console */
import fastify from 'fastify';
import sirv from 'sirv';
import fastifyExpress from 'fastify-express';
import { createRequestHandler } from '@mcansh/remix-fastify';
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

async function start() {
  try {
    let app = fastify();

    app.addContentTypeParser('*', (_request, payload, done) => {
      let data = '';
      payload.on('data', chunk => {
        data += chunk;
      });
      payload.on('end', () => {
        done(null, data);
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await app.register(fastifyExpress);

    app.addHook('preHandler', (request, reply, done) => {
      let method = request.method.toLowerCase();
      console.log(`${method} ${request.url}`);
      const isMethodReplayable = !['get', 'options', 'head'].includes(method);
      const isReadOnlyRegion =
        process.env.FLY_REGION &&
        process.env.PRIMARY_REGION &&
        process.env.FLY_REGION !== process.env.PRIMARY_REGION;

      const shouldReplay = isMethodReplayable && isReadOnlyRegion;

      if (!shouldReplay) return done();

      return reply
        .status(409)
        .header('fly-replay', `region=${process.env.FLY_PRIMARY_REGION}`)
        .send(`rewriting to ${process.env.FLY_PRIMARY_REGION}`);
    });

    app.use(
      '/build',
      sirv('public/build', {
        dev: MODE !== 'production',
        etag: true,
        dotfiles: true,
        maxAge: 31536000,
        immutable: true,
      })
    );

    app.use(
      sirv('public', {
        dev: MODE !== 'production',
        etag: true,
        dotfiles: true,
        maxAge: 3600,
      })
    );

    app.all('*', createRequestHandler({ build: serverBuild }));

    let port = process.env.PORT ?? 3000;

    app.listen(port, '0.0.0.0', () => {
      console.log(`Fastify server listening on port ${port}`);
    });
  } catch (error: unknown) {
    console.error(error);
    process.exit(1);
  }
}

void start();
