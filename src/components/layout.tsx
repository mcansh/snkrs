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
      />
      <Head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👟</text></svg>"
        />
      </Head>
      {children}
    </>
  );
};

export { Layout };
