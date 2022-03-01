import * as React from 'react';
import type { LinksFunction, LoaderFunction, MetaFunction } from 'remix';
import { useLoaderData, useTransition, json, Outlet, useMatches } from 'remix';
import * as Fathom from 'fathom-client';
import toast from 'react-hot-toast';
import clsx from 'clsx';

import globalCSS from './styles/global.css';
import interCSS from './styles/inter.css';
import { flashMessageKey } from './constants';
import { Notifications } from './notifications';
import refreshClockwise from './icons/refresh-clockwise.svg';
import { getSession, commitSession } from './session';
import type { Flash, Match } from './@types/types';
import { getSeo } from './seo';
import { Document } from './components/document';

export { CatchBoundary } from '~/components/root-catch-boundary';
export { ErrorBoundary } from '~/components/root-error-boundary';

interface RouteData {
  flash?: Flash;
  ENV: {
    FATHOM_SITE_ID: string;
    FATHOM_SCRIPT_URL: string;
  };
}

let [seoMeta, seoLinks] = getSeo();

export const meta: MetaFunction = () => ({
  ...seoMeta,
  'apple-mobile-web-app-title': 'Sneakers',
  'application-name': 'Sneakers',
  'msapplication-TileColor': '#000000',
  'theme-color': '#fff',
  'apple-mobile-web-app-capable': 'yes',
  'apple-mobile-web-app-status-bar-style': 'black-translucent',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
});

export const links: LinksFunction = () => [
  ...seoLinks,
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

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get('Cookie'));
  const flash = session.get(flashMessageKey) as Flash | undefined;

  if (flash) {
    const data: RouteData = {
      flash,
      ENV: {
        FATHOM_SITE_ID: process.env.FATHOM_SITE_ID,
        FATHOM_SCRIPT_URL: process.env.FATHOM_SCRIPT_URL,
      },
    };
    return json(data, {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    });
  }

  const data: RouteData = {
    flash: undefined,
    ENV: {
      FATHOM_SITE_ID: process.env.FATHOM_SITE_ID,
      FATHOM_SCRIPT_URL: process.env.FATHOM_SCRIPT_URL,
    },
  };

  return json(data);
};

export default function App() {
  const { flash, ENV } = useLoaderData<RouteData>();
  const transition = useTransition();
  const pendingLocation = transition.location;

  let matches = useMatches() as unknown as Array<Match>;
  let handleBodyClassName = matches.map(match => match.handle?.bodyClassName);

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
  }, [flash]);

  return (
    <Document
      bodyClassName={clsx(
        pendingLocation ? 'opacity-60 cursor-not-allowed' : '',
        handleBodyClassName
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
    </Document>
  );
}
