import * as React from 'react';
import type { LinksFunction, LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
  Links,
  Meta,
  Scripts,
  usePendingLocation,
  useRouteData,
  useLiveReload,
} from '@remix-run/react';
import * as Fathom from 'fathom-client';
import { Outlet, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';

import globalCSS from './styles/global.css';
import type { Flash } from './@types/flash';
import { flashMessageKey } from './constants';
import { withSession } from './lib/with-session';
import { safeParse } from './utils/safe-parse';
import { Notifications } from './notifications';

const noScriptPaths = new Set<string>([]);

interface RouteData {
  flash?: Flash;
}

const links: LinksFunction = () => [{ rel: 'stylesheet', href: globalCSS }];

const loader: LoaderFunction = ({ request }) =>
  withSession(request, session => {
    const flash = session.get(flashMessageKey);

    const parsed = flash ? safeParse(flash) : flash;

    return json({ flash: parsed });
  });

const App: React.VFC = () => {
  const { flash } = useRouteData<RouteData>();
  const pendingLocation = usePendingLocation();
  const location = useLocation();
  const includeScripts = !noScriptPaths.has(location.pathname);

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
    <html lang="en">
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
        <link rel="preload" href="https://rsms.me/inter/inter.css" as="style" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <meta name="apple-mobile-web-app-title" content="Sneakers" />
        <meta name="application-name" content="Sneakers" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#f7f7f7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="robots" content="index,follow" />
        <meta name="googlebot" content="index,follow" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@loganmcansh" />
        <meta name="twitter:creator" content="@loganmcansh" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Home | Sneaker Collection" />
        <meta property="og:locale" content="en_US" />
        <Meta />
        <Links />
      </head>
      <body
        style={{
          opacity: pendingLocation ? 0.6 : undefined,
          cursor: pendingLocation ? 'not-allowed' : undefined,
        }}
      >
        <Notifications />

        <main className="container min-h-full p-4 pb-6 mx-auto">
          <Outlet />
        </main>
        {includeScripts && <Scripts />}
      </body>
    </html>
  );
};

export default App;
export { links, loader };
