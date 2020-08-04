import React from 'react';
import { AppProps, NextWebVitalsMetric } from 'next/app';

import { Layout } from 'src/components/layout';
import { logMetric } from 'src/utils/log-metric';

import 'src/styles/index.css';

const App = ({ Component, pageProps }: AppProps) => {
  React.useEffect(() => {
    const tracker = window.document.createElement('script');
    const firstScript = window.document.getElementsByTagName('script')[0];
    tracker.defer = true;
    tracker.setAttribute('site', 'HIUAENVC');
    tracker.setAttribute('spa', 'auto');
    tracker.setAttribute('excluded-domains', 'localhost');
    tracker.src = 'https://kiwi.mcan.sh/script.js';
    firstScript.parentNode?.insertBefore(tracker, firstScript);
  }, []);

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
