import { onError } from '@apollo/link-error';
import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  HttpLink,
  DefaultOptions,
  NormalizedCacheObject,
} from '@apollo/client';

let globalApolloClient: ApolloClient<NormalizedCacheObject> | undefined;

const endpoint = 'http://localhost:3000/api/graphql';

function createIsomorphLink() {
  if (typeof window === 'undefined') {
    // These have to imported dynamically, instead of at the root of the page,
    // in order to make sure that we're not shipping server-side code to the client
    // eslint-disable-next-line
    const { SchemaLink } = require("@apollo/link-schema");
    // eslint-disable-next-line
    const { schema } = require("src/graphql/schema");
    // eslint-disable-next-line
    const { PrismaClient } = require("@prisma/client");
    const db = new PrismaClient();

    return new SchemaLink({ schema, context: { db } });
  } else {
    return new HttpLink({
      uri: endpoint,
    });
  }
}

const errorLink = onError(({ networkError, graphQLErrors }) => {
  if (graphQLErrors) {
    graphQLErrors.map(({ message }) => console.warn(message));
  }
  if (networkError) console.warn(networkError);
});

const link = ApolloLink.from([errorLink, createIsomorphLink()]);

const defaultOptions: DefaultOptions = {
  query: {
    fetchPolicy: 'cache-first',
  },
  mutate: {
    errorPolicy: 'all',
  },
};

function createApolloClient(initialState = {}) {
  const ssrMode = typeof window === 'undefined';
  const cache = new InMemoryCache().restore(initialState);

  return new ApolloClient({
    ssrMode,
    link,
    cache,
    defaultOptions,
  });
}

function initApolloClient(initialState = {}) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  // ref https://github.com/zeit/next.js/blob/canary/examples/api-routes-apollo-server-and-client/apollo/client.js
  if (typeof window === 'undefined') {
    return createApolloClient(initialState);
  }

  if (!globalApolloClient) {
    globalApolloClient = createApolloClient(initialState);
  }

  return globalApolloClient;
}

export { endpoint, createApolloClient, initApolloClient };
