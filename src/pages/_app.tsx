import React from 'react';
import { AppProps, NextWebVitalsMetric } from 'next/app';
import * as Fathom from 'fathom-client';

import { Layout } from 'src/components/layout';
import { logMetric } from 'src/utils/log-metric';

import 'src/styles/index.css';

const App: React.FC<AppProps> = ({ Component, pageProps, router }) => {
  React.useEffect(() => {
    Fathom.load('HIUAENVC', {
      excludedDomains: ['localhost'],
      url: 'https://kiwi.mcan.sh/script.js',
    });
  }, []);

  React.useEffect(() => {
    router.events.on('routeChangeComplete', Fathom.trackPageview);
  });

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
};

export const reportWebVitals = (metric: NextWebVitalsMetric) => {
  if (metric.label === 'web-vital') {
    logMetric(metric);
  }
};

export default App;
