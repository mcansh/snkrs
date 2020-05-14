import React from 'react';
import { DefaultSeo } from 'next-seo';
import Head from 'next/head';

import { useServiceWorker } from 'src/hooks/use-service-worker';

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
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
      </Head>
      {children}
    </>
  );
};

export { Layout };
