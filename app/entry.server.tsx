import { renderToString } from 'react-dom/server';
import type { EntryContext, HandleDataRequestFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import etag from 'etag';

// https://securityheaders.com
let cspSettings = {
  'default-src': ["'self'"],
  'img-src': [
    "'self'",
    'data:',
    'https://dof0zryca-res.cloudinary.com',
    'https://kiwi.mcan.sh',
  ],
  'style-src': ["'self'", "'unsafe-inline'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://kiwi.mcan.sh/script.js'],
  'connect-src': [
    "'self'",
    ...(process.env.NODE_ENV === 'production' ? [] : [`ws://localhost:8002`]),
  ],
};

let contentSecurityPolicy = `${Object.entries(cspSettings)
  .map(([key, val]) => `${key} ${val.filter(Boolean).join(' ')}`)
  .join(';')}`;

export default function handleDocumentRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  let url = new URL(request.url);
  if (url.hostname === 'sneakers.mcan.sh') {
    return redirect(`https://snkrs.mcan.sh${url.pathname}`);
  }

  if (process.env.NODE_ENV === 'development') {
    responseHeaders.set('Cache-Control', 'no-cache');
  }

  // eslint-disable-next-line testing-library/render-result-naming-convention
  let markup = renderToString(
    <RemixServer url={request.url} context={remixContext} />
  );

  let markupETag = etag(markup);

  if (markupETag === request.headers.get('If-None-Match')) {
    return new Response('', { status: 304 });
  }

  responseHeaders.set('Content-Type', 'text/html');
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag
  responseHeaders.set('ETag', markupETag);
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
  responseHeaders.set('Content-Security-Policy', contentSecurityPolicy);
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  responseHeaders.set('X-Frame-Options', 'DENY');
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
  responseHeaders.set('X-DNS-Prefetch-Control', 'on');
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
  responseHeaders.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
  responseHeaders.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy
  responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

  if (process.env.FLY_REGION) {
    responseHeaders.set('X-Fly-Region', process.env.FLY_REGION);
  }

  return new Response(`<!DOCTYPE html>${markup}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}

export let handleDataRequest: HandleDataRequestFunction = (
  response,
  { request }
) => {
  let method = request.method.toLowerCase();
  if (method === 'get' && !response.headers.has('Cache-Control')) {
    let purpose =
      request.headers.get('Purpose') ??
      request.headers.get('X-Purpose') ??
      request.headers.get('Sec-Purpose') ??
      request.headers.get('Sec-Fetch-Purpose') ??
      request.headers.get('Moz-Purpose');

    response.headers.set(
      'Cache-Control',
      purpose === 'prefetch' ? 'private max-age=3' : ''
    );
  }

  if (process.env.FLY_REGION) {
    response.headers.set('X-Fly-Region', process.env.FLY_REGION);
  }

  return response;
};
