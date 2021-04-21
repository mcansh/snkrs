import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { RemixServer } from '@remix-run/react';
import type { EntryContext } from '@remix-run/node';

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
    },
  });
}
