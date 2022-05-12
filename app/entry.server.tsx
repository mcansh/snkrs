import { renderToString } from 'react-dom/server';
import type { EntryContext, HandleDataRequestFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';
import etag from 'etag';
import { createSecureHeaders } from '@mcansh/remix-secure-headers';

let securityHeaders = createSecureHeaders({
  'Content-Security-Policy': {
    'default-src': ["'self'"],
    'img-src': [
      "'self'",
      'data:',
      'https://dof0zryca-res.cloudinary.com',
      'https://kiwi.mcan.sh',
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      'https://kiwi.mcan.sh/script.js',
    ],
    'connect-src':
      process.env.NODE_ENV === 'production'
        ? ["'self'"]
        : ["'self'", `ws://localhost:${process.env.REMIX_DEV_SERVER_WS_PORT}`],
  },
  'Permissions-Policy': {
    accelerometer: [],
    ambientLightSensor: [],
    autoplay: [],
    battery: [],
    camera: [],
    displayCapture: [],
    documentDomain: [],
    encryptedMedia: [],
    executionWhileNotRendered: [],
    executionWhileOutOfViewport: [],
    fullscreen: [],
    gamepad: [],
    geolocation: [],
    gyroscope: [],
    layoutAnimations: [],
    legacyImageFormats: [],
    magnetometer: [],
    microphone: [],
    midi: [],
    navigationOverride: [],
    oversizedImages: [],
    payment: [],
    pictureInPicture: [],
    publickeyCredentialsGet: [],
    speakerSelection: [],
    syncXhr: [],
    unoptimizedImages: [],
    unsizedMedia: [],
    usb: [],
    screenWakeLock: [],
    webShare: [],
    xrSpatialTracking: [],
  },
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-DNS-Prefetch-Control': 'on',
});

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

  let markup = renderToString(
    <RemixServer url={request.url} context={remixContext} />
  );

  let markupETag = etag(markup);
  let ifNoneMatch = request.headers.get('If-None-Match');
  // eslint-disable-next-line no-console
  console.log({
    url: request.url,
    etag: markupETag,
    ifNoneMatch,
  });

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('ETag', markupETag);
  for (let header of securityHeaders) {
    responseHeaders.set(...header);
  }

  if (process.env.FLY_REGION) {
    responseHeaders.set('X-Fly-Region', process.env.FLY_REGION);
  }

  if (markupETag === ifNoneMatch) {
    return new Response('', { status: 304 });
  }

  return new Response(`<!DOCTYPE html>${markup}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}

export let handleDataRequest: HandleDataRequestFunction = async (
  response,
  { request }
) => {
  let method = request.method.toLowerCase();

  if (method === 'get') {
    let body = await response.text();
    let bodyETag = etag(body);
    let ifNoneMatch = request.headers.get('If-None-Match');
    // eslint-disable-next-line no-console
    console.log({
      url: request.url,
      etag: bodyETag,
      ifNoneMatch,
    });
    response.headers.set('etag', bodyETag);
    if (bodyETag === ifNoneMatch) {
      return new Response('', { status: 304 });
    }
  }

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
