import React from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';

import { withApollo } from 'src/components/with-apollo';
import { initApolloClient } from 'src/graphql/apollo';
import {
  GetSneakersDocument,
  useGetSneakersQuery,
} from 'src/graphql/generated';
import { getCloudinaryURL } from 'src/utils/cloudinary';
import { formatMoney } from 'src/utils/format-money';
import { formatDate } from 'src/utils/format-date';

const SneakersList = () => {
  const { data } = useGetSneakersQuery({ fetchPolicy: 'cache-and-network' });

  if (!data?.getSneakers) return <p>Loading...</p>;

  if (!data.getSneakers.length) return <p>No sneakers</p>;

  return (
    <main className="p-4">
      <h1 className="text-4xl">Sneaker Collection</h1>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
        {data.getSneakers.map(sneaker => (
          <li
            key={sneaker.id}
            className="overflow-hidden transition-shadow duration-200 ease-linear rounded-lg shadow-md hover:shadow-lg bg-white"
          >
            <Link href="/sneakers/[id]" as={`/sneakers/${sneaker.id}`}>
              <a className="flex flex-col block h-full ">
                <div className="relative flex items-center justify-center">
                  <img
                    loading="lazy"
                    src={getCloudinaryURL(sneaker.imagePublicId, 'f_auto')}
                    alt={`${sneaker.model} by ${sneaker.brand} in the ${sneaker.colorway} colorway`}
                    className="object-cover w-full h-56"
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

const Index = () => <SneakersList />;

export const getStaticProps: GetStaticProps = async () => {
  const client = initApolloClient({});
  await client.query({ query: GetSneakersDocument });
  /*
    Because this is using withApollo, the data from this query will be
    pre-populated in the Apollo cache at build time. When the user first
    visits this page, we can retrieve the data from the cache like this:
    const { data } = useGetSneakersQuery({ fetchPolicy: 'cache-and-network' })
    This preserves the ability for the page to render all bookmarks instantly,
    then get progressively updated if any new bookmarks come in over the wire.
  */
  const apolloStaticCache = client.cache.extract();
  return {
    // because this data is slightly more dynamic, update it every hour
    unstable_revalidate: 60 * 60,
    props: {
      apolloStaticCache,
    },
  };
};

export default withApollo(Index);
