import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { RemixServer } from '@remix-run/react';
import type { EntryContext } from '@remix-run/node';

// https://securityheaders.com
const cspSettings = {
  'default-src': ["'self'"],
  'img-src': ["'self'", 'data:', 'https://images.mcan.sh/upload/'],
  'style-src-elem': ["'self'", 'https://rsms.me/inter/inter.css'],
  'font-src': ['https://rsms.me/inter/font-files/'],
  'script-src': ["'self'", "'unsafe-inline'", 'https://kiwi.mcan.sh/script.js'],
  'connect-src':
    process.env.NODE_ENV === 'production' ? [] : ['ws://localhost:3001'],
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
