import * as React from 'react';
import type {
  LinksFunction,
  LoaderArgs,
  V2_MetaFunction,
} from '@remix-run/node';
import { json } from '@remix-run/node';
import {
  Form,
  Link,
  Outlet,
  useLoaderData,
  useTransition,
} from '@remix-run/react';
import * as Fathom from 'fathom-client';
import clsx from 'clsx';

import { useMatches } from './lib/use-matches';
import { getUser } from './session.server';
import { createTitle } from './seo';

import globalStylesHref from '~/styles/global.css';
import interStylesHref from '~/styles/inter.css';
import refreshClockwise from '~/assets/icons/refresh-clockwise.svg';
import { Document } from '~/components/document';

export { CatchBoundary } from '~/components/root-catch-boundary';
export { ErrorBoundary } from '~/components/root-error-boundary';

export let meta: V2_MetaFunction = () => {
  let title = createTitle();
  return [
    { name: 'apple-mobile-web-app-title', content: 'Sneakers' },
    { name: 'application-name', content: 'Sneakers' },
    { name: 'msapplication-TileColor', content: '#000000' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent',
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, viewport-fit=cover',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'en_US' },
    { property: 'og:title', content: title },
    { property: 'og:site_name', content: title },
    { property: 'og:url', content: 'https://snkrs.mcan.sh' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@loganmcansh' },
    { name: 'twitter:creator', content: '@loganmcansh' },
  ];
};

export let links: LinksFunction = () => [
  { rel: 'stylesheet', href: globalStylesHref },
  { rel: 'stylesheet', href: interStylesHref },
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

export async function loader({ request }: LoaderArgs) {
  let user = await getUser(request);
  return json({
    user,
    ENV: {
      FATHOM_SITE_ID: process.env.FATHOM_SITE_ID,
      FATHOM_SCRIPT_URL: process.env.FATHOM_SCRIPT_URL,
    },
  });
}

export default function App() {
  let data = useLoaderData<typeof loader>();
  let transition = useTransition();
  let [showPendingSpinner, setShowPendingSpinner] = React.useState(false);

  let matches = useMatches();
  let handleBodyClassName = matches.map(match => match.handle?.bodyClassName);

  React.useEffect(() => {
    Fathom.load(data.ENV.FATHOM_SITE_ID, {
      excludedDomains: ['localhost'],
      url: data.ENV.FATHOM_SCRIPT_URL,
    });
  }, [data.ENV]);

  React.useEffect(() => {
    let timer = setTimeout(() => {
      setShowPendingSpinner(transition.state !== 'idle');
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [transition.state]);

  return (
    <Document
      bodyClassName={clsx(
        showPendingSpinner ? 'opacity-60 cursor-not-allowed' : '',
        handleBodyClassName
      )}
    >
      {showPendingSpinner && (
        <div className="fixed z-10 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 transform-gpu">
          <svg className="z-10 w-10 h-10 text-blue-600 animate-spin">
            <use href={`${refreshClockwise}#refresh-clockwise`} />
          </svg>
        </div>
      )}

      <nav className="flex items-center justify-end px-4 py-2 sm:px-6 lg:px-8">
        {data.user ? (
          <div className="flex items-center space-x-4">
            <Link to="/sneakers/add">Add Sneaker</Link>
            <Form reloadDocument method="post" action="/logout">
              <button type="submit">Logout</button>
            </Form>
          </div>
        ) : (
          <div className="space-x-4">
            <Link to="/login">Login</Link>
            <Link to="/join">Join</Link>
          </div>
        )}
      </nav>

      <Outlet />
    </Document>
  );
}
