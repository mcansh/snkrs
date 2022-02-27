import { renderToString } from 'react-dom/server';
import { RemixServer, redirect } from 'remix';
import etag from 'etag';
import type { EntryContext, HandleDataRequestFunction } from 'remix';

// https://securityheaders.com
const cspSettings = {
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

const contentSecurityPolicy = `${Object.entries(cspSettings)
  .map(([key, val]) => `${key} ${val.filter(Boolean).join(' ')}`)
  .join(';')}`;

export default function handleDocumentRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const url = new URL(request.url);
  if (url.hostname === 'sneakers.mcan.sh') {
    return redirect(`https://snkrs.mcan.sh${url.pathname}`);
  }

  if (process.env.NODE_ENV === 'development') {
    responseHeaders.set('Cache-Control', 'no-cache');
  }

  // eslint-disable-next-line testing-library/render-result-naming-convention
  const markup = renderToString(
    <RemixServer url={request.url} context={remixContext} />
  );

  const markupETag = etag(markup);

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

export const handleDataRequest: HandleDataRequestFunction = (
  response,
  { request }
) => {
  let method = request.method.toLowerCase();
  if (method === 'get' && !response.headers.has('Cache-Control')) {
    const purpose = request.headers.get('Purpose');
    response.headers.set(
      'Cache-Control',
      purpose === 'prefetch' ? 'max-age=3' : 'no-cache'
    );
  }

  if (process.env.FLY_REGION) {
    response.headers.set('X-Fly-Region', process.env.FLY_REGION);
  }

  return response;
};
