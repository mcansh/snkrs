import * as React from 'react';
import {
  Links,
  Meta,
  Scripts,
  LiveReload,
  useLoaderData,
  useTransition,
} from 'remix';
import * as Fathom from 'fathom-client';
import { Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { json } from 'remix-utils';
import type {
  ErrorBoundaryComponent,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from 'remix';

import globalCSS from './styles/global.css';
import interCSS from './styles/inter.css';
import { flashMessageKey } from './constants';
import { Notifications } from './notifications';
import refreshClockwise from './icons/refresh-clockwise.svg';
import { getSession, commitSession } from './session';
import type { Flash } from './@types/types';

interface RouteData {
  flash?: Flash;
  ENV: {
    FATHOM_SITE_ID: string;
    FATHOM_SCRIPT_URL: string;
  };
}

const meta: MetaFunction = () => ({
  'apple-mobile-web-app-title': 'Sneakers',
  'application-name': 'Sneakers',
  'msapplication-TileColor': '#000000',
  'theme-color': '#fff',
  'apple-mobile-web-app-capable': 'yes',
  'apple-mobile-web-app-status-bar-style': 'black-translucent',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  robots: 'index,follow',
  googlebot: 'index,follow',
});

const links: LinksFunction = () => [
  { rel: 'stylesheet', href: globalCSS },
  { rel: 'stylesheet', href: interCSS },
  {
    rel: 'icon',
    href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ctext x='0' y='14'%3E👟%3C/text%3E%3C/svg%3E",
  },
  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: '/apple-touch-icon.png',
  },
  {
    rel: 'alternate icon',
    type: 'image/png',
    sizes: '32x32',
    href: '/favicon-32x32.png',
  },
  {
    rel: 'alternate icon',
    type: 'image/png',
    sizes: '16x16',
    href: '/favicon-16x16.png',
  },
  { rel: 'manifest', href: '/manifest.webmanifest' },
  { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#000000' },
];

const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const flash = session.get(flashMessageKey) as string | undefined;

  if (flash) {
    return json<RouteData>(
      {
        flash,
        ENV: {
          FATHOM_SITE_ID: process.env.FATHOM_SITE_ID,
          FATHOM_SCRIPT_URL: process.env.FATHOM_SCRIPT_URL,
        },
      },
      {
        headers: {
          'Set-Cookie': await commitSession(session),
        },
      }
    );
  }

  return json<RouteData>({
    flash: undefined,
    ENV: {
      FATHOM_SITE_ID: process.env.FATHOM_SITE_ID,
      FATHOM_SCRIPT_URL: process.env.FATHOM_SCRIPT_URL,
    },
  });
};

const App: React.VFC = () => {
  const { flash, ENV } = useLoaderData<RouteData>();
  const transition = useTransition();
  const pendingLocation = transition.location;

  React.useEffect(() => {
    Fathom.load(ENV.FATHOM_SITE_ID, {
      excludedDomains: ['localhost'],
      url: ENV.FATHOM_SCRIPT_URL,
    });
  }, [ENV]);

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
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <Meta />
        <Links />
      </head>
      <body
        className={clsx(
          'min-h-screen',
          pendingLocation ? 'opacity-60 cursor-not-allowed' : ''
        )}
      >
        <Notifications />

        {pendingLocation && (
          <div className="fixed z-10 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 transform-gpu">
            <svg className="z-10 w-10 h-10 text-blue-600 animate-spin">
              <use href={`${refreshClockwise}#refresh-clockwise`} />
            </svg>
          </div>
        )}

        <Outlet />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
};

const ErrorBoundary: ErrorBoundaryComponent = ({ error }) => {
  console.error('Check your server terminal output');

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <title>Shoot...</title>
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen w-[90%] max-w-5xl mx-auto pt-20 space-y-4 font-mono text-center text-white bg-blue-bsod">
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
        <LiveReload />
      </body>
    </html>
  );
};

export default App;
export { ErrorBoundary, links, loader, meta };
