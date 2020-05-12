import React from 'react';
import { AppProps } from 'next/app';

import { Layout } from 'src/components/layout';

import 'src/styles/index.css';

const App = ({ Component, pageProps }: AppProps) => {
  React.useEffect(() => {
    const tracker = window.document.createElement('script');
    const firstScript = window.document.getElementsByTagName('script')[0];
    tracker.defer = true;
    tracker.setAttribute('site', 'HIUAENVC');
    tracker.setAttribute('spa', 'auto');
    tracker.src = 'https://kiwi.mcan.sh/script.js';
    firstScript.parentNode?.insertBefore(tracker, firstScript);
  }, []);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
};

export const reportWebVitals = (metric: any) => {
  function logMetric({ name, value }: { name: string; value: number }) {
    const url = `https://qckm.io?m=${name}&v=${value}&k=${process.env.QUICKMETRICS_API_KEY}`;

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      fetch(url, { method: 'POST', keepalive: true });
    }
  }

  logMetric(metric);
};

export default App;
