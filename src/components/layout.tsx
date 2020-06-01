import React from 'react';
import { DefaultSeo } from 'next-seo';
import Head from 'next/head';
import { SWRConfig } from 'swr';

import { useServiceWorker } from 'src/hooks/use-service-worker';
import { fetcher } from 'src/utils/fetcher';

const Layout: React.FC = ({ children }) => {
  useServiceWorker();

  return (
    <>
      <DefaultSeo
        title="Home"
        description="Logan McAnsh's sneaker collection"
        titleTemplate="%s | Sneaker Collection"
        openGraph={{ type: 'website', locale: 'en_US' }}
        twitter={{
          cardType: 'summary_large_image',
          handle: '@loganmcansh',
          site: '@loganmcansh',
        }}
        additionalMetaTags={[
          { name: 'apple-mobile-web-app-title', content: 'Sneakers' },
          { name: 'application-name', content: 'Sneakers' },
          { name: 'msapplication-TileColor', content: '#000000' },
          { name: 'theme-color', content: '#f7f7f7' },
          { name: 'apple-mobile-web-app-capable', content: 'yes' },
          {
            name: 'apple-mobile-web-app-status-bar-style',
            content: 'black',
          },
          {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1, viewport-fit=cover',
          },
        ]}
      />
      <Head>
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
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </Head>
      <SWRConfig value={{ fetcher }}>{children}</SWRConfig>
    </>
  );
};

export { Layout };
