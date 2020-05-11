import React from 'react';
import { AppProps } from 'next/app';

import { Layout } from 'src/components/layout';

import 'src/styles/index.css';

const App = ({ Component, pageProps }: AppProps) => (
  <Layout>
    <Component {...pageProps} />
  </Layout>
);

export default App;
