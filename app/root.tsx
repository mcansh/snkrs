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
import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';

import globalCSS from './styles/global.css';
import type { Flash } from './@types/flash';
import { flashMessageKey } from './constants';
import { withSession } from './lib/with-session';

const noScriptPaths = new Set<string>([]);

interface RouteData {
  flash?: Flash;
}

const links: LinksFunction = () => [{ rel: 'stylesheet', href: globalCSS }];

const loader: LoaderFunction = ({ request }) =>
  withSession(request, session => {
    const flash = session.get(flashMessageKey);

    if (flash) {
      let parsed;
      try {
        parsed = JSON.parse(flash);
      } catch (error) {
        // failed to parse json
        parsed = flash;
      }
      return json({ flash: parsed });
    }

    return json({ flash: undefined });
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

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👟</text></svg>"
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
        <AnimatePresence initial={includeScripts}>
          {flash && (
            <motion.div
              className={clsx(
                'fixed z-10 p-2 text-white -translate-y-full rounded-lg shadow-md top-2 left-2',
                typeof flash === 'string'
                  ? 'bg-purple-500'
                  : flash.type === 'error'
                  ? 'bg-red-500'
                  : 'bg-purple-500'
              )}
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.25 }}
              >
                {typeof flash === 'string' ? flash : flash.message}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        <Outlet />
        {includeScripts && <Scripts />}
      </body>
    </html>
  );
};

export default App;
export { links, loader };
