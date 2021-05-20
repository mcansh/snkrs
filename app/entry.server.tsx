import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { RemixServer } from 'remix';

import type { EntryContext } from 'remix';

// https://securityheaders.com
const cspSettings = {
  'default-src': ["'self'"],
  'img-src': [
    "'self'",
    'data:',
    'https://res.cloudinary.com',
    'https://kiwi.mcan.sh',
  ],
  'style-src': ["'self'", "'unsafe-inline'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://kiwi.mcan.sh/script.js'],
  'connect-src': [
    ...(process.env.NODE_ENV === 'production'
      ? ['https://snkrs.mcan.sh']
      : ['ws://localhost:3001', "'self'"]),
  ],
};

const contentSecurityPolicy = `${Object.entries(cspSettings)
  .map(([key, val]) => `${key} ${val.filter(Boolean).join(' ')}`)
  .join(';')}`;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  if (process.env.NODE_ENV === 'development') {
    responseHeaders.set('Cache-Control', 'no-cache');
  }

  const markup = renderToString(
    <RemixServer url={request.url} context={remixContext} />
  );

  return new Response(`<!DOCTYPE html>${markup}`, {
    status: responseStatusCode,
    headers: {
      ...Object.fromEntries(responseHeaders),
      'Content-Type': 'text/html',
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
      'Content-Security-Policy': contentSecurityPolicy,
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
      'Referrer-Policy': 'origin-when-cross-origin',
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
      'X-Frame-Options': 'DENY',
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
      'X-Content-Type-Options': 'nosniff',
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
      'X-DNS-Prefetch-Control': 'on',
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
      'Strict-Transport-Security':
        'max-age=31536000; includeSubDomains; preload',
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  });
}
