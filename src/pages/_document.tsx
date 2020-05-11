import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';

import { CSP } from 'src/components/csp';

export default class MyDocument extends Document {
  public render() {
    return (
      <Html lang="en">
        <Head>
          <CSP {...this.props} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
