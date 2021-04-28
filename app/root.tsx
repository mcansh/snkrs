import * as React from 'react';
import type {
  ErrorBoundaryComponent,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/node';
import { json } from '@remix-run/node';
import {
  Links,
  Meta,
  Scripts,
  usePendingLocation,
  useRouteData,
  useLiveReload,
  useMatches,
} from '@remix-run/react';
import * as Fathom from 'fathom-client';
import { Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';

import globalCSS from './styles/global.css';
import interCSS from './styles/inter.css';
import type { Flash } from './@types/flash';
import { flashMessageKey } from './constants';
import { withSession } from './lib/with-session';
import { safeParse } from './utils/safe-parse';
import { Notifications } from './notifications';
import refresh from './icons/outline/refresh.svg';

interface RouteData {
  flash?: Flash;
}

const meta: MetaFunction = () => ({
  'apple-mobile-web-app-title': 'Sneakers',
  'application-name': 'Sneakers',
  'msapplication-TileColor': '#000000',
  'theme-color': '#f7f7f7',
  'apple-mobile-web-app-capable': 'yes',
  'apple-mobile-web-app-status-bar-style': 'black-translucent',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  robots: 'index,follow',
  googlebot: 'index,follow',
});

const links: LinksFunction = () => [
  { rel: 'stylesheet', href: globalCSS },
  { rel: 'stylesheet', href: interCSS },
];

const loader: LoaderFunction = ({ request }) =>
  withSession(request, session => {
    const flash = session.get(flashMessageKey);

    const parsed = flash ? safeParse(flash) : flash;

    return json({ flash: parsed });
  });

const App: React.VFC = () => {
  const { flash } = useRouteData<RouteData>();
  const pendingLocation = usePendingLocation();
  const matches = useMatches();
  const includeScripts = matches.some(match => match.handle?.hydrate !== false);

  useLiveReload();

  React.useEffect(() => {
    Fathom.load('HIUAENVC', {
      excludedDomains: ['localhost'],
      url: 'https://kiwi.mcan.sh/script.js',
    });
  }, []);

  React.useEffect(() => {
    if (flash) {
      toast(typeof flash === 'string' ? flash : flash.message, {
        className: clsx(
          'p-2 text-white rounded-lg',
          typeof flash === 'string'
            ? 'bg-purple-500'
            : flash.type === 'error'
            ? 'bg-red-500'
            : 'bg-purple-500'
        ),
      });
    }
  });

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ctext x='0' y='14'%3E👟%3C/text%3E%3C/svg%3E"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="alternate icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="alternate icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <Meta />
        <Links />
      </head>
      <body
        className={clsx(
          'h-full bg-gray-100',
          pendingLocation ? 'opacity-60 cursor-not-allowed' : ''
        )}
      >
        <Notifications />

        {pendingLocation && (
          <div className="fixed z-10 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 transform-gpu">
            <svg className="z-10 w-10 h-10 text-blue-600 animate-spin">
              <use href={`${refresh}#refresh`} />
            </svg>
          </div>
        )}

        <Outlet />
        {includeScripts && <Scripts />}
      </body>
    </html>
  );
};

const ErrorBoundary: ErrorBoundaryComponent = ({ error }) => {
  useLiveReload();

  React.useEffect(() => {
    Fathom.load('HIUAENVC', {
      excludedDomains: ['localhost'],
      url: 'https://kiwi.mcan.sh/script.js',
    });
  }, []);

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ctext x='0' y='14'%3E👟%3C/text%3E%3C/svg%3E"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="alternate icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="alternate icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <Meta />
        <Links />
      </head>
      <body className="h-full w-[90%] max-w-5xl mx-auto mt-20 space-y-4 font-mono text-center text-white bg-blue-bsod">
        <h1 className="inline-block text-3xl font-bold bg-white text-blue-bsod">
          Uncaught Exception!
        </h1>
        <p>
          If you are not the developer, please click back in your browser and
          try again.
        </p>
        <pre className="px-4 py-2 overflow-auto border-4 border-white">
          {error.message}
        </pre>
        <p>
          There was an uncaught exception in your application. Check the browser
          console and/or the server console to inspect the error.
        </p>
        <Scripts />
      </body>
    </html>
  );
};

export default App;
export { ErrorBoundary, links, loader, meta };
