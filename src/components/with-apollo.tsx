import * as React from 'react';
import { ApolloProvider } from '@apollo/client';
import { NextPage } from 'next';

import { initApolloClient } from 'src/graphql/apollo';

/*
  This wrapper helps to provide Apollo functionality during SSR, while rehydrating
  on the client with a pre-populated cache of the query results.

  Refer to https://github.com/zeit/next.js/blob/canary/examples/api-routes-apollo-server-and-client/apollo/client.js
  for more source.
*/

interface Props {
  apolloStaticCache: any;
}

export function withApollo(PageComponent: NextPage | any) {
  const WithApollo = ({ apolloStaticCache, ...pageProps }: Props) => {
    // apolloStaticCache prop gets set in getStaticProps on page views
    const client = initApolloClient(apolloStaticCache);
    return (
      <ApolloProvider client={client}>
        <PageComponent {...pageProps} />
      </ApolloProvider>
    );
  };

  // Set the correct displayName in development
  if (process.env.NODE_ENV !== 'production') {
    const displayName =
      (PageComponent.displayName ?? PageComponent.name) || 'Component';

    WithApollo.displayName = `withApollo(${displayName})`;
  }

  return WithApollo;
}
