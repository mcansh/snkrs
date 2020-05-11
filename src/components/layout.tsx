import React from 'react';
import { DefaultSeo } from 'next-seo';

import { useServiceWorker } from 'src/hooks/use-service-worker';

const Layout: React.FC = ({ children }) => {
  useServiceWorker();

  return (
    <>
      <DefaultSeo
        title="Home"
        canonical="https://sneakers.mcan.sh"
        description="Logan McAnsh's sneaker collection"
        titleTemplate="%s | Sneaker Collection"
        openGraph={{ type: 'website', locale: 'en_US' }}
        twitter={{
          cardType: 'summary_large_image',
          handle: '@loganmcansh',
          site: '@loganmcansh',
        }}
      />
      {children}
    </>
  );
};

export { Layout };
