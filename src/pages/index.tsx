import React from 'react';
import { GetStaticProps, NextPage } from 'next';
import Link from 'next/link';
import { SimpleImg } from 'react-simple-img';
import { NormalizedCacheObject } from '@apollo/client';

import { getCloudinaryURL } from 'src/utils/cloudinary';
import { formatMoney } from 'src/utils/format-money';
import { formatDate } from 'src/utils/format-date';
import { withApollo } from 'src/components/with-apollo';
import { initApolloClient } from 'src/graphql/apollo';
import {
  GetSneakersDocument,
  useGetSneakersQuery,
} from 'src/graphql/generated';

interface Props {
  apolloStaticCache: NormalizedCacheObject;
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const client = initApolloClient({});
  await client.query({ query: GetSneakersDocument });
  /*
     Because this is using withApollo, the data from this query will be
     pre-populated in the Apollo cache at build time. When the user first
     visits this page, we can retrieve the data from the cache like this:
     const { data } = useGetSneakersQuery({ fetchPolicy: 'cache-and-network' })
     This preserves the ability for the page to render all sneakers instantly,
     then get progressively updated if any new sneakers come in over the wire.
   */
  const apolloStaticCache = client.cache.extract();

  return {
    // because this data is slightly more dynamic, update it every hour
    unstable_revalidate: 60 * 60,
    props: { apolloStaticCache },
  };
};

const Index: NextPage<Props> = () => {
  const { data, error } = useGetSneakersQuery({
    fetchPolicy: 'cache-and-network',
  });
  // this can happen if the route is navigated to from the client or if the
  // cache fails to populate for whatever reason
  if (!data || !data.getSneakers) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>Loading...</p>
      </div>
    );
  }
  if (error) return null;
  return (
    <main className="h-full p-4">
      <h1 className="text-4xl">Sneaker Collection</h1>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
        {data.getSneakers.map(sneaker => (
          <li
            key={sneaker.id}
            className="overflow-hidden transition-shadow duration-200 ease-linear bg-white rounded-lg shadow-md hover:shadow-lg"
          >
            <Link href="/sneakers/[id]" as={`/sneakers/${sneaker.id}`}>
              <a className="flex flex-col block h-full ">
                <div className="relative flex items-center justify-center flex-grow">
                  <SimpleImg
                    src={getCloudinaryURL(sneaker.imagePublicId)}
                    alt={`${sneaker.model} by ${sneaker.brand} in the ${sneaker.colorway} colorway`}
                    height={200}
                    width={200}
                    applyAspectRatio
                    className="w-full h-full"
                  />
                  {sneaker.sold && (
                    <div className="absolute w-full p-1 text-xl font-bold text-center text-white transform -translate-x-1/2 -translate-y-1/2 bg-red-400 bg-opacity-75 top-1/2 left-1/2">
                      Sold!
                    </div>
                  )}
                </div>
                <div className="px-4 py-2">
                  <h2 className="text-xl truncate">
                    {sneaker.brand} {sneaker.model}
                  </h2>
                  <p className="text-lg truncate">{sneaker.colorway}</p>
                  {sneaker.price && <p>{formatMoney(sneaker.price)}</p>}
                  {sneaker.purchaseDate && (
                    <p>Purchased {formatDate(sneaker.purchaseDate)}</p>
                  )}
                </div>
              </a>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
};

export default withApollo(Index);
