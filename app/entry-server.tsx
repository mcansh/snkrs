import React from 'react';
import { renderToString } from 'react-dom/server';
import Remix from '@remix-run/react/server';
import type { EntryContext } from '@remix-run/core';

import { App } from './app';

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const markup = renderToString(
    <Remix url={request.url} context={remixContext}>
      <App />
    </Remix>
  );

  return new Response(`<!DOCTYPE html>${markup}`, {
    status: responseStatusCode,
    headers: {
      ...Object.fromEntries(responseHeaders),
      'Content-Type': 'text/html',
    },
  });
}
